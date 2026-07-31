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
  pricing?: {
    prompt: string;
    completion: string;
  };
}

const PROVIDERS = ['groq', 'openrouter', 'nvidia', 'huggingface'] as const;
type ProviderKey = (typeof PROVIDERS)[number];

const PROVIDER_META: Record<ProviderKey, { label: string; modelListUrl: string; requiresKey: boolean }> = {
  groq: {
    label: 'Groq',
    modelListUrl: 'https://api.groq.com/openai/v1/models',
    requiresKey: true
  },
  openrouter: {
    label: 'OpenRouter',
    modelListUrl: 'https://openrouter.ai/api/v1/models',
    requiresKey: false
  },
  nvidia: {
    label: 'NVIDIA',
    modelListUrl: 'https://integrate.api.nvidia.com/v1/models',
    requiresKey: true
  },
  huggingface: {
    label: 'HuggingFace',
    modelListUrl: 'https://api-inference.huggingface.co/models?limit=120&filter=text-generation&sort=trendingScore&direction=-1',
    requiresKey: true
  }
};

function isFreeModel(provider: ProviderKey, model: RawModel): boolean {
  if (provider === 'openrouter') {
    const prompt = Number(model.pricing?.prompt ?? 0);
    const completion = Number(model.pricing?.completion ?? 0);
    return prompt === 0 && completion === 0;
  }
  if (provider === 'huggingface') {
    return true;
  }
  if (provider === 'nvidia') {
    return true;
  }
  if (provider === 'groq') {
    const freeIds = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile'];
    const id = model.id.toLowerCase();
    return freeIds.some((f) => id === f || id.includes(f));
  }
  return false;
}

function normalizeName(model: RawModel, provider: ProviderKey): string {
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
        context: m.context_window || 0,
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
  const apiKey = typeof req.query.key === 'string' ? req.query.key : '';
  const username = typeof req.query.username === 'string' ? req.query.username : '';

  const fetchAll = !rawProvider || rawProvider === 'all';

  const providersToFetch: ProviderKey[] = fetchAll ? [...PROVIDERS] : [rawProvider as ProviderKey];

  if (!fetchAll && !PROVIDERS.includes(providersToFetch[0])) {
    return res.status(400).json({ error: `Unsupported provider. Allowed: ${PROVIDERS.join(', ')}` });
  }

  const results = await Promise.all(
    providersToFetch.map(async (provider) => {
      const key = apiKey || (username ? undefined : undefined);
      const models = await fetchProviderModels(provider, key || '');
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
