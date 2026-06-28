export interface ModelMeta {
  id: string;
  name: string;
  contextWindow: number;
  tokenCostPerMillionInput: number;
  tokenCostPerMillionOutput: number;
  capabilities: {
    streaming: boolean;
    vision: boolean;
    toolCalling: boolean;
  };
}

export interface ProviderState {
  name: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  latencyMs: number;
  connected: boolean;
  models: ModelMeta[];
}

export class ProviderRegistry {
  private registry: Map<string, ProviderState> = new Map();

  constructor() {
    this.initializeCatalog();
  }

  private initializeCatalog() {
    // Register Groq capabilities
    this.registry.set('groq', {
      name: 'Groq',
      status: 'RED',
      latencyMs: 0,
      connected: false,
      models: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 128000, tokenCostPerMillionInput: 0.59, tokenCostPerMillionOutput: 0.79, capabilities: { streaming: true, vision: false, toolCalling: true } },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', contextWindow: 128000, tokenCostPerMillionInput: 0.05, tokenCostPerMillionOutput: 0.08, capabilities: { streaming: true, vision: false, toolCalling: true } },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Llama 70B', contextWindow: 128000, tokenCostPerMillionInput: 0.70, tokenCostPerMillionOutput: 0.90, capabilities: { streaming: true, vision: false, toolCalling: false } }
      ]
    });

    // Register OpenRouter capabilities
    this.registry.set('openrouter', {
      name: 'OpenRouter',
      status: 'RED',
      latencyMs: 0,
      connected: false,
      models: [
        { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', contextWindow: 32000, tokenCostPerMillionInput: 0.07, tokenCostPerMillionOutput: 0.07, capabilities: { streaming: true, vision: false, toolCalling: true } },
        { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', contextWindow: 160000, tokenCostPerMillionInput: 2.50, tokenCostPerMillionOutput: 2.50, capabilities: { streaming: true, vision: false, toolCalling: false } }
      ]
    });

    // Register NVIDIA capabilities
    this.registry.set('nvidia', {
      name: 'NVIDIA',
      status: 'RED',
      latencyMs: 0,
      connected: false,
      models: [
        { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Llama 3.1 Nemotron 70B', contextWindow: 128000, tokenCostPerMillionInput: 0.70, tokenCostPerMillionOutput: 0.90, capabilities: { streaming: true, vision: false, toolCalling: true } }
      ]
    });

    // Register HuggingFace capabilities
    this.registry.set('huggingface', {
      name: 'HuggingFace',
      status: 'RED',
      latencyMs: 0,
      connected: false,
      models: [
        { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', contextWindow: 131000, tokenCostPerMillionInput: 0.00, tokenCostPerMillionOutput: 0.00, capabilities: { streaming: true, vision: false, toolCalling: false } }
      ]
    });
  }

  public getProvider(name: string): ProviderState | undefined {
    return this.registry.get(name.toLowerCase());
  }

  public async refreshProviderHealth(name: string, checkFn: () => Promise<number>): Promise<ProviderState> {
    const prov = this.registry.get(name.toLowerCase());
    if (!prov) throw new Error(`Provider ${name} not found in catalog.`);

    try {
      const latency = await checkFn();
      prov.connected = true;
      prov.latencyMs = latency;
      prov.status = latency < 800 ? 'GREEN' : latency < 2000 ? 'YELLOW' : 'RED';
    } catch {
      prov.connected = false;
      prov.latencyMs = 0;
      prov.status = 'RED';
    }

    return prov;
  }

  public getAllProviders(): ProviderState[] {
    return Array.from(this.registry.values());
  }
}
