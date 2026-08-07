type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
};

export interface LiveModel {
  id: string;
  name: string;
  provider: 'Groq' | 'OpenRouter' | 'NVIDIA' | 'HuggingFace';
  tier: 'FREE' | 'PAID';
  context: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

interface RawModel {
  id: string;
  name?: string;
  context_window?: number;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

const PROVIDERS = ['groq', 'openrouter', 'nvidia', 'huggingface'] as const;
type ProviderKey = (typeof PROVIDERS)[number];

const PROVIDER_META: Record<
  ProviderKey,
  { label: string; modelListUrl: string; requiresKey: boolean; envKey: string }
> = {
  groq: {
    label: 'Groq',
    modelListUrl: 'https://api.groq.com/openai/v1/models',
    requiresKey: true,
    envKey: 'GROQ_API_KEY'
  },
  openrouter: {
    label: 'OpenRouter',
    modelListUrl: 'https://openrouter.ai/api/v1/models',
    requiresKey: false,
    envKey: 'OPENROUTER_API_KEY'
  },
  nvidia: {
    label: 'NVIDIA',
    modelListUrl: 'https://integrate.api.nvidia.com/v1/models',
    requiresKey: true,
    envKey: 'NVIDIA_API_KEY'
  },
  huggingface: {
    label: 'HuggingFace',
    modelListUrl: 'https://api-inference.huggingface.co/models?limit=120&filter=text-generation&sort=trendingScore&direction=-1',
    requiresKey: true,
    envKey: 'HUGGINGFACE_API_KEY'
  }
};

function isFreeModel(provider: ProviderKey, model: RawModel): boolean {
  if (provider === 'openrouter') {
    // OpenRouter reports real per-model pricing; a model is FREE only when
    // both prompt and completion price are 0 (free tier, e.g. "model:free").
    const prompt = Number(model.pricing?.prompt ?? 0);
    const completion = Number(model.pricing?.completion ?? 0);
    return prompt === 0 && completion === 0;
  }
  if (provider === 'groq') {
    // Groq's model list API has no pricing field; Groq serves its catalog on
    // a free tier (rate-limited). All Groq models are FREE.
    return true;
  }
  if (provider === 'nvidia') {
    // NVIDIA NIM developer preview models are served free of charge.
    return true;
  }
  if (provider === 'huggingface') {
    // HuggingFace free Inference API for text-generation models.
    return true;
  }
  return false;
}

function normalizeName(model: RawModel, _provider: ProviderKey): string {
  if (model.name && model.name !== model.id) return model.name;
  const parts = model.id.split(/[:./-]+/);
  const namePart = parts[parts.length - 1];
  const family = parts[parts.length - 2];
  const label = namePart || model.id;
  if (family && family.toLowerCase() !== namePart?.toLowerCase()) {
    return `${family} ${label}`;
  }
  return label.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function apiKeyFromEnv(provider: ProviderKey): string {
  const value = process.env[PROVIDER_META[provider].envKey];
  return typeof value === 'string' && value.length > 0 ? value : '';
}

async function fetchProviderModels(provider: ProviderKey, apiKey: string): Promise<LiveModel[]> {
  const meta = PROVIDER_META[provider];

  if (meta.requiresKey && !apiKey) {
    return [];
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(meta.modelListUrl, { headers, signal: controller.signal });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    const rawList: RawModel[] = Array.isArray(payload) ? payload : payload.data || [];

    const models = rawList
      .filter((m) => m && typeof m.id === 'string')
      .map((m) => ({
        id: m.id,
        name: normalizeName(m, provider),
        provider: meta.label as LiveModel['provider'],
        tier: isFreeModel(provider, m) ? ('FREE' as const) : ('PAID' as const),
        context: m.context_window || m.context_length || 0,
        pricing: m.pricing
          ? {
              prompt: Number(m.pricing.prompt),
              completion: Number(m.pricing.completion)
            }
          : undefined
      }))
      .sort((a, b) => {
        if (a.tier !== b.tier) return a.tier === 'FREE' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return models.slice(0, 60);
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawProvider = typeof req.query.provider === 'string' ? req.query.provider.toLowerCase() : '';
  const rawKeys = Array.isArray(req.query.key)
    ? (req.query.key as string[])
    : typeof req.query.key === 'string'
      ? [req.query.key]
      : [];
  const username = typeof req.query.username === 'string' ? req.query.username : '';

  const fetchAll = !rawProvider || rawProvider === 'all';

  const providersToFetch: ProviderKey[] = fetchAll ? [...PROVIDERS] : [rawProvider as ProviderKey];

  if (!fetchAll && !PROVIDERS.includes(providersToFetch[0])) {
    return res.status(400).json({ error: `Unsupported provider. Allowed: ${PROVIDERS.join(', ')}` });
  }

  const { loadUserSecrets } = await import('./utils/secrets.js');
  const storedSecrets = await loadUserSecrets(username);
  const providerToSecretKey: Record<ProviderKey, keyof typeof storedSecrets> = {
    groq: 'groq',
    openrouter: 'openrouter',
    nvidia: 'nvidia',
    huggingface: 'huggingface',
  };

  const results = await Promise.all(
    providersToFetch.map(async (provider, index) => {
      const stored = storedSecrets[providerToSecretKey[provider]];
      const key =
        (typeof stored === 'string' && stored.length > 0 ? stored : '') ||
        rawKeys[index] ||
        apiKeyFromEnv(provider) ||
        '';
      const models = await fetchProviderModels(provider, key);
      return {
        provider,
        label: PROVIDER_META[provider].label,
        connected: models.length > 0,
        freeCount: models.filter((m) => m.tier === 'FREE').length,
        paidCount: models.filter((m) => m.tier === 'PAID').length,
        models
      };
    })
  );

  return res.status(200).json({ results });
}
