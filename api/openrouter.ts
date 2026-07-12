/// <reference types="node" />

declare const process: {
  env: Record<string, string | undefined>;
};

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function detectLanguage(codeStr: string): string {
  if (!codeStr || !codeStr.trim()) return 'unknown';
  if (
    codeStr.includes('yaml-language-server') ||
    codeStr.includes('rules:') ||
    codeStr.includes('reviews:') ||
    codeStr.includes('early_access:') ||
    (/^[a-zA-Z0-9_-]+:\s+/m.test(codeStr) && !codeStr.includes('{') && !codeStr.includes('}'))
  ) {
    return 'yaml';
  }
  if ((codeStr.includes('def ') || codeStr.includes('import ')) && codeStr.includes(':')) return 'python';
  if (codeStr.includes('#include') || codeStr.includes('int main')) return 'cpp';
  if (codeStr.includes('<html') || codeStr.includes('<div') || codeStr.includes('<!DOCTYPE html>')) return 'html';
  if (codeStr.includes('{') && codeStr.includes('}') && codeStr.includes(':')) return 'css';
  if (codeStr.includes('const ') || codeStr.includes('let ') || codeStr.includes('function ') || codeStr.includes('console.log')) return 'javascript';
  return 'unknown';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language, model, agentMode, skill, plugin, customPrompt, provider, keys, isBossChat } = req.body || {};

  // --- 1. Language Detection ---
  const activeLanguage = (language === 'auto' || !language) ? detectLanguage(code || '') : language;
  const isJSorTS = activeLanguage === 'javascript' || activeLanguage === 'typescript';
  let activeSkill = skill;
  if (!isJSorTS && activeSkill === 'Syntax Repair') {
    activeSkill = 'Bug Isolation';
  }

  // --- 2. Model Sanitization ---
  let sanitizedModel = '';
  if (model !== undefined && model !== null) {
    if (typeof model !== 'string') {
      return res.status(400).json({ error: 'Model parameter must be a string.' });
    }
    sanitizedModel = model.trim();
  }

  // --- 3. Plugin Validation ---
  const allowedPlugins = [
    'Test Runner',
    'Console Trace',
    'Diff Reviewer',
    'Repo Scanner',
    'API Schema Reader',
    'Dependency Audit'
  ];

  let trimmedPlugin: string | undefined;
  if (plugin !== undefined && plugin !== null) {
    if (typeof plugin !== 'string') {
      return res.status(400).json({ error: 'Plugin parameter must be a string.' });
    }
    trimmedPlugin = plugin.trim();
    if (trimmedPlugin && !allowedPlugins.includes(trimmedPlugin)) {
      return res.status(400).json({ error: `Invalid plugin parameter. Allowed: ${allowedPlugins.join(', ')}` });
    }
  }

  // --- 4. Custom Prompt Sanitization ---
  let sanitizedCustomPrompt = '';
  if (customPrompt) {
    const trimmed = String(customPrompt).trim();
    if (trimmed.length > 500) {
      return res.status(400).json({ error: 'customPrompt exceeds maximum allowed length of 500 characters.' });
    }
    sanitizedCustomPrompt = trimmed
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/ignore\s+previous\s+instructions|system\s+prompt|reset\s+instructions/gi, '[INJECTION REMOVED]');
  }

  if (!code && !isBossChat) {
    return res.status(400).json({ error: 'Missing code' });
  }

  // --- 5. Provider Detection ---
  let providerName = provider || '';
  if (!providerName) {
    if (sanitizedModel) {
      if (
        sanitizedModel.includes('openrouter') ||
        sanitizedModel.startsWith('qwen/') ||
        sanitizedModel.startsWith('deepseek/') ||
        sanitizedModel.includes('google/gemma-3') ||
        sanitizedModel.includes('google/gemini')
      ) {
        providerName = 'OpenRouter';
      } else if (
        sanitizedModel.includes('nvidia/') ||
        sanitizedModel.startsWith('meta/') ||
        sanitizedModel.includes('deepseek-ai/deepseek-r1') ||
        sanitizedModel.includes('nvidia/nemotron')
      ) {
        providerName = 'NVIDIA';
      } else if (
        sanitizedModel.includes('Llama-3.3') ||
        sanitizedModel.includes('DeepSeek-R1') ||
        sanitizedModel.includes('Mistral-7B') ||
        sanitizedModel.startsWith('google/gemma-2') ||
        sanitizedModel.includes('HuggingFace')
      ) {
        providerName = 'HuggingFace';
      } else {
        providerName = 'Groq';
      }
    } else {
      providerName = 'Groq';
    }
  }

  // --- 6. Default Model Selection ---
  let selectedModel = sanitizedModel && sanitizedModel !== 'openrouter/auto' ? sanitizedModel : '';
  if (!selectedModel) {
    if (providerName === 'Groq') {
      selectedModel = 'llama-3.3-70b-versatile';
    } else if (providerName === 'OpenRouter') {
      selectedModel = 'meta-llama/llama-3.3-70b-instruct';
    } else if (providerName === 'NVIDIA') {
      selectedModel = 'meta/llama-3.3-70b-instruct';
    } else if (providerName === 'HuggingFace') {
      selectedModel = 'meta-llama/Llama-3.3-70B-Instruct';
    } else {
      selectedModel = 'llama-3.3-70b-versatile';
      providerName = 'Groq';
    }
  }

  // --- 7. API Key Resolution ---
  let apiKey = '';
  if (providerName === 'Groq') {
    apiKey = keys?.groq || process.env.GROQ_API_KEY || '';
  } else if (providerName === 'OpenRouter') {
    apiKey = keys?.openrouter || process.env.OPENROUTER_API_KEY || '';
  } else if (providerName === 'NVIDIA') {
    apiKey = keys?.nvidia || process.env.NVIDIA_API_KEY || '';
  } else if (providerName === 'HuggingFace') {
    apiKey = keys?.huggingface || process.env.HUGGINGFACE_API_KEY || '';
  }

  if (!apiKey) {
    if (process.env.NODE_ENV === 'test') {
      apiKey = 'mock-key-for-testing';
    } else {
      return res.status(400).json({
        error: `Missing API Key for provider: ${providerName}. Please enter it in Settings or supply it as an environment variable.`
      });
    }
  }

  // --- 8. Configure API URL & Headers ---
  let fetchUrl = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (providerName === 'Groq') {
    fetchUrl = 'https://api.groq.com/openai/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (providerName === 'OpenRouter') {
    fetchUrl = 'https://openrouter.ai/api/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = 'https://volt-code-ai.vercel.app';
    headers['X-Title'] = 'Volt Code AI';
  } else if (providerName === 'NVIDIA') {
    fetchUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (providerName === 'HuggingFace') {
    fetchUrl = 'https://api-inference.huggingface.co/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // --- 9. Skill Map ---
  const skillMap: Record<string, string> = {
    'Syntax Repair': 'Focus: syntax errors, off-by-one, null access, undefined vars.',
    'Bug Isolation': 'Focus: logic bugs, wrong output, incorrect conditions, edge cases.',
    'Patch Generator': 'Focus: generate minimal fix patches for identified issues.',
    'Fix Verification': 'Focus: verify fixes are correct, no regressions introduced.',
    'Root Cause Drilldown': 'Focus: deep analysis of root cause, not just symptoms.',
    'Regression Guard': 'Focus: check if fix introduces new bugs or breaks existing code.',
  };

  // --- 10. Python Guardrail ---
  let pythonGuardrailPrompt = '';
  if (activeLanguage === 'python') {
    pythonGuardrailPrompt = `
[CRITICAL IMMUTABLE CONSTRAINT FOR PYTHON FILES]
- The target code is Python. You MUST NOT use or inject any JavaScript, Node.js, or CommonJS structures or syntax.
- DO NOT use JS keywords like 'const', 'let', 'function', or '==='.
- DO NOT rewrite Python imports (e.g., 'import time') as CommonJS requires (e.g., 'const time = require(...)').
- DO NOT change Python dictionary accesses (e.g., 'session_data["role"]') into JavaScript bracketless property accesses (e.g., 'session_data.role').
- DO NOT wrap Python functions (defined with 'def') inside JavaScript functions.
- Keep all modifications idiomatic and syntactically valid in Python.
`;
  }

  // --- 13. Execute API Call ---
  try {
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: isBossChat
              ? `You are the VOLT AI Agent Head, the supreme core orchestrator and 'boss' of the VOLT AI platform.

Your mission is to represent VOLT AI: an Agentic AI Coding Editor, Code Fixer, Code Refiner, and Bug Diagnosing WebApp—a complete Agentic AI-powered Code Mechanic.
When the user talks to you, you must communicate with authority and deep technical expertise.
Specifically:
1. Understand the user's request.
2. Recommend the exact AI model (e.g. DeepSeek-R1 for reasoning, Llama-3.3-70B for general tasks, Qwen-2.5-Coder for code generation, Nemotron for instruction following) that fits the user's coding challenge.
3. Keep the vision of VOLT AI as a powerful agentic compiler mechanic front and center.
4. Return ONLY valid JSON in the format:
{
  "summary": "Your conversational reply here, explaining your reasoning and model choices"
}`
              : `Role: Senior debug agent. Return ONLY valid JSON. No markdown. No prose.

${skillMap[activeSkill] || 'Focus: all bug types equally.'}
${trimmedPlugin ? `Active Plugin Diagnostic: Apply specialized logic checks for "${trimmedPlugin}".` : ''}
${pythonGuardrailPrompt}

Output schema:
{
  "issues": [
    {
      "id": 1,
      "type": "string",
      "severity": "Critical|High|Medium|Low",
      "line": 0,
      "description": "string",
      "original": "string",
      "fixed": "string",
      "explanation": "string"
    }
  ],
  "fixedCode": "string",
  "summary": "string"
}

Rules:
- Max 10 issues
- severity=Critical means crash/security
- High=wrong output
- Medium=perf/smell
- Low=style
- Truncate fixedCode if >200 lines`
          },
          {
            role: 'user',
            content: isBossChat
              ? `User Message: "${sanitizedCustomPrompt || 'Introduce yourself'}"\nActive Editor Code Context:\n${code || 'No code in editor'}`
              : `Language: ${activeLanguage || 'auto'}\nMode: ${agentMode || 'assist'}\n\nCode:\n${code}${sanitizedCustomPrompt ? `\n\nUser Question/Instruction:\n${sanitizedCustomPrompt}\nPlease address this instruction specifically in your JSON "summary" response output.` : ''}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2048
      })
    });

    const data = (await response.json()) as GroqResponse;

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'OpenRouter error',
        details: data
      });
    }

    const text = data?.choices?.[0]?.message?.content;
    const usage = data?.usage || {};

    if (!text) {
      return res.status(500).json({
        error: 'Empty model response',
        details: data
      });
    }

    // --- 14. Parse JSON Response ---
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {
          return res.status(500).json({
            error: 'Model did not return valid JSON',
            raw: text
          });
        }
      } else {
        return res.status(500).json({
          error: 'Model did not return valid JSON',
          raw: text
        });
      }
    }

    // --- 15. Normalize Response Keys ---
    if (parsed) {
      if (parsed.fixed_code && !parsed.fixedCode) {
        parsed.fixedCode = parsed.fixed_code;
      }
      if (parsed.explanation && !parsed.summary) {
        parsed.summary = parsed.explanation;
      }
      if (parsed.fixes && Array.isArray(parsed.fixes) && !parsed.issues) {
        parsed.issues = parsed.fixes.map((fix: any, index: number) => ({
          id: fix.id || index + 1,
          type: fix.type || 'style',
          severity: fix.severity || 'Medium',
          line: fix.line || 0,
          description: fix.description || fix.explanation || '',
          original: fix.original || '',
          fixed: fix.fixed || '',
          explanation: fix.explanation || ''
        }));
      }
    }

    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);

    return res.status(200).json({
      ...parsed,
      tokensUsed: totalTokens,
      promptTokens,
      completionTokens,
      modelUsed: selectedModel
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Server error',
      details: error?.message || 'Unknown error'
    });
  }
}
