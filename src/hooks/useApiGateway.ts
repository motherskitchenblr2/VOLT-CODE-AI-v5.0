import { useState, useCallback } from 'react';

interface RequestPayload {
  code: string;
  language: string;
  model: string;
  skill: string;
  plugin: string;
  customPrompt?: string;
}

export const useApiGateway = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const executeQuery = useCallback(async (payload: RequestPayload, keys: {
    groqKey?: string;
    openrouterKey?: string;
    nvidiaKey?: string;
    huggingfaceKey?: string;
  }) => {
    setLoading(true);
    const providers = ['Groq', 'OpenRouter', 'NVIDIA', 'HuggingFace'];
    let lastError: any = null;

    for (const provider of providers) {
      const keyKey = (provider.toLowerCase() + 'Key') as keyof typeof keys;
      const key = keys[keyKey];

      if (!key) {
        setLogs(prev => [...prev, `[GATEWAY] Skipping ${provider}: API Key not loaded.`]);
        continue;
      }

      setLogs(prev => [...prev, `[GATEWAY] Directing request to ${provider} API Gateway...`]);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second request window

        const response = await fetch('/api/openrouter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            provider,
            keys: {
              groq: keys.groqKey,
              openrouter: keys.openrouterKey,
              nvidia: keys.nvidiaKey,
              huggingface: keys.huggingfaceKey
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Endpoint returned HTTP status ${response.status}`);
        }

        const data = await response.json();
        setLogs(prev => [...prev, `[GATEWAY] ${provider} responded successfully.`]);
        setLoading(false);
        return data;

      } catch (err: any) {
        lastError = err;
        setLogs(prev => [...prev, `[GATEWAY] Failure with ${provider}: ${err.message || 'Timeout'}. Transitioning to next provider...`]);
      }
    }

    setLoading(false);
    throw new Error(`All configured AI providers failed. Last exception: ${lastError?.message || 'Unknown network error'}`);
  }, []);

  return { executeQuery, loading, logs, setLogs };
};
