import { useCallback, useEffect, useRef, useState } from "react";

export interface LiveModel {
  id: string;
  name: string;
  provider: "Groq" | "OpenRouter" | "NVIDIA" | "HuggingFace";
  tier: "FREE" | "PAID";
  context: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface ProviderAvailability {
  provider: string;
  label: string;
  connected: boolean;
  freeCount: number;
  paidCount: number;
  models: LiveModel[];
}

interface AvailabilityResponse {
  results: ProviderAvailability[];
}

interface ProviderKeys {
  groq?: string;
  openrouter?: string;
  nvidia?: string;
  huggingface?: string;
}

const PROVIDER_KEY_MAP: Array<{ provider: string; key: keyof ProviderKeys }> = [
  { provider: "groq", key: "groq" },
  { provider: "openrouter", key: "openrouter" },
  { provider: "nvidia", key: "nvidia" },
  { provider: "huggingface", key: "huggingface" },
];

export function useLiveProviderModels(keys: ProviderKeys, username?: string) {
  const [availability, setAvailability] = useState<ProviderAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const keysRef = useRef(keys);

  useEffect(() => {
    keysRef.current = keys;
  });

  const refresh = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const currentKeys = keysRef.current;
    const query = new URLSearchParams({ provider: "all" });
    if (username) {
      query.append("username", username);
    }
    for (const { key } of PROVIDER_KEY_MAP) {
      const value = currentKeys[key];
      if (value) {
        query.append("key", value);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/models?${query.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Availability check failed: HTTP ${response.status}`);
      }
      const data: AvailabilityResponse = await response.json();
      setAvailability(data.results || []);
      setLastUpdated(Date.now());
    } catch (err: unknown) {
      const error = err as Error | undefined;
      if (error?.name !== "AbortError") {
        setError(error?.message || "Failed to fetch provider availability");
      }
    } finally {
      setLoading(false);
    }
  }, [username]);

  const groq = keys.groq;
  const openrouter = keys.openrouter;
  const nvidia = keys.nvidia;
  const huggingface = keys.huggingface;

  useEffect(() => {
    const timer = setTimeout(() => {
      refresh();
    }, 300);
    // Auto-refresh: every 30 minutes + on tab focus, so the catalog tracks
    // provider changes without the user pressing Refresh.
    const isTest =
      typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    let interval: ReturnType<typeof setInterval> | undefined;
    let onVisible: (() => void) | undefined;
    if (!isTest) {
      interval = setInterval(
        () => {
          refresh();
        },
        30 * 60 * 1000,
      );
      onVisible = () => {
        if (!document.hidden) refresh();
      };
      document.addEventListener("visibilitychange", onVisible);
    }
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
      if (onVisible)
        document.removeEventListener("visibilitychange", onVisible);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [refresh, groq, openrouter, nvidia, huggingface]);

  return { availability, loading, error, lastUpdated, refresh };
}
