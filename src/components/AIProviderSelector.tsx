import React, { useState } from "react";
import { ChevronDown, RefreshCw, Check } from "lucide-react";

interface Model {
  id: string;
  name: string;
  capability: "text" | "code" | "multimodal";
  tier: "fast" | "balanced" | "quality";
  maxTokens: number;
  costPer1kTokens: number;
}

interface Provider {
  id: string;
  name: string;
  apiKey?: string;
  isConnected: boolean;
  models: Model[];
}

interface AIProviderSelectorProps {
  onProviderChange: (provider: Provider, model: Model) => void;
  onModelChange: (model: Model) => void;
}

export function AIProviderSelector({
  onProviderChange,
  onModelChange,
}: AIProviderSelectorProps) {
  const [providers] = useState<Provider[]>([
    {
      id: "openai",
      name: "OpenAI",
      isConnected: false,
      models: [
        {
          id: "gpt-4",
          name: "GPT-4 (Best Quality)",
          capability: "text",
          tier: "quality",
          maxTokens: 8192,
          costPer1kTokens: 0.03,
        },
        {
          id: "gpt-4-turbo",
          name: "GPT-4 Turbo (Balanced)",
          capability: "code",
          tier: "balanced",
          maxTokens: 128000,
          costPer1kTokens: 0.01,
        },
        {
          id: "gpt-3.5-turbo",
          name: "GPT-3.5 Turbo (Fast)",
          capability: "text",
          tier: "fast",
          maxTokens: 4096,
          costPer1kTokens: 0.0005,
        },
      ],
    },
    {
      id: "anthropic",
      name: "Anthropic",
      isConnected: false,
      models: [
        {
          id: "claude-3-opus",
          name: "Claude 3 Opus (Best)",
          capability: "code",
          tier: "quality",
          maxTokens: 200000,
          costPer1kTokens: 0.015,
        },
        {
          id: "claude-3-sonnet",
          name: "Claude 3 Sonnet (Balanced)",
          capability: "multimodal",
          tier: "balanced",
          maxTokens: 200000,
          costPer1kTokens: 0.003,
        },
        {
          id: "claude-3-haiku",
          name: "Claude 3 Haiku (Fast)",
          capability: "text",
          tier: "fast",
          maxTokens: 200000,
          costPer1kTokens: 0.00025,
        },
      ],
    },
    {
      id: "google",
      name: "Google Vertex AI",
      isConnected: false,
      models: [
        {
          id: "gemini-pro",
          name: "Gemini Pro (Advanced)",
          capability: "code",
          tier: "quality",
          maxTokens: 32768,
          costPer1kTokens: 0.0005,
        },
        {
          id: "gemini-pro-vision",
          name: "Gemini Pro Vision (Multimodal)",
          capability: "multimodal",
          tier: "balanced",
          maxTokens: 32768,
          costPer1kTokens: 0.0005,
        },
        {
          id: "palm-2",
          name: "PaLM 2 (Legacy)",
          capability: "text",
          tier: "fast",
          maxTokens: 8192,
          costPer1kTokens: 0.0002,
        },
      ],
    },
    {
      id: "cohere",
      name: "Cohere",
      isConnected: false,
      models: [
        {
          id: "command",
          name: "Command (Advanced)",
          capability: "code",
          tier: "quality",
          maxTokens: 4096,
          costPer1kTokens: 0.001,
        },
        {
          id: "command-light",
          name: "Command Light (Fast)",
          capability: "text",
          tier: "fast",
          maxTokens: 2048,
          costPer1kTokens: 0.0003,
        },
      ],
    },
  ]);

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    providers[0],
  );
  const [selectedModel, setSelectedModel] = useState<Model | null>(
    providers[0]?.models[0],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setSelectedModel(provider.models[0]);
    onProviderChange(provider, provider.models[0]);
    setIsOpen(false);
  };

  const handleModelSelect = (model: Model) => {
    if (!selectedProvider) return;
    setSelectedModel(model);
    onModelChange(model);
  };

  const refreshModels = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to fetch fresh model list
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In real implementation, fetch from actual APIs
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#FF5F00]/20 rounded-2xl">
      <div className="text-xs font-bold text-[#FF5F00] uppercase tracking-wider mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-[#FF5F00] rounded-full"></div>
        AI Provider Selection
      </div>

      {/* Provider Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-black/60 border border-[#FF5F00]/30 rounded-xl text-left hover:border-[#FF5F00]/50 transition-all"
        >
          <div>
            <div className="text-xs text-white/40 uppercase font-bold tracking-wide">
              Provider
            </div>
            <div className="text-sm font-bold text-[#FF5F00]">
              {selectedProvider?.name}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#FF5F00] transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-[#0a0a0a] border border-[#FF5F00]/40 rounded-xl overflow-hidden z-50 shadow-lg">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                  selectedProvider?.id === provider.id
                    ? "bg-[#FF5F00]/20 text-[#FF5F00] border-l-2 border-[#FF5F00]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${selectedProvider?.id === provider.id ? "bg-[#FF5F00]" : "bg-white/20"}`}
                ></div>
                <div>
                  <div className="font-bold text-sm">{provider.name}</div>
                  <div className="text-xs text-white/40">
                    {provider.models.length} models available
                  </div>
                </div>
                {selectedProvider?.id === provider.id && (
                  <Check className="w-4 h-4 ml-auto text-[#FF5F00]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model Selector */}
      {selectedProvider && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/40 uppercase font-bold tracking-wide">
              Model
            </div>
            <button
              onClick={refreshModels}
              disabled={isLoading}
              className="text-[10px] text-[#FF5F00] hover:text-[#FF5F00]/80 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
            {selectedProvider.models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className={`p-3 rounded-lg text-left text-xs transition-all border ${
                  selectedModel?.id === model.id
                    ? "bg-[#FF5F00]/10 border-[#FF5F00]/60 text-[#FF5F00]"
                    : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                <div className="font-semibold">{model.name}</div>
                <div className="text-[10px] text-white/40 mt-1 space-y-0.5">
                  <div>Max Tokens: {model.maxTokens.toLocaleString()}</div>
                  <div className="flex gap-2">
                    <span className="px-1.5 py-0.5 bg-white/10 rounded">
                      Tier: {model.tier}
                    </span>
                    <span className="px-1.5 py-0.5 bg-white/10 rounded">
                      Type: {model.capability}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cost Calculator */}
      {selectedModel && (
        <div className="p-3 bg-black/60 border border-green-500/20 rounded-lg">
          <div className="text-xs font-bold text-green-400 mb-2">
            Cost Estimate
          </div>
          <div className="text-xs text-green-300/70">
            <div>
              ${(selectedModel.costPer1kTokens * 1000).toFixed(4)} per 1000
              tokens
            </div>
            <div className="text-[10px] text-white/30 mt-1">
              Actual cost varies by request size
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
