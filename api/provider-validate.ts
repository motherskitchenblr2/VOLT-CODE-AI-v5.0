import { decrypt, encrypt } from './utils/crypto';
import { connectToDatabase } from './utils/db';
import { UserSettingsModel, AuditLogModel } from '../src/models/Schemas';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, provider, keyRaw } = req.body;
  if (!username || !provider || !keyRaw) {
    return res.status(400).json({ error: 'Missing parameters: username, provider, and keyRaw are required.' });
  }

  try {
    await connectToDatabase();

    // 1. Verify credentials connectivity
    let fetchUrl = '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (provider === 'groq') {
      fetchUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keyRaw}`;
    } else if (provider === 'openrouter') {
      fetchUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keyRaw}`;
    } else if (provider === 'nvidia') {
      fetchUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keyRaw}`;
    } else if (provider === 'huggingface') {
      fetchUrl = 'https://api-inference.huggingface.co/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keyRaw}`;
    } else {
      return res.status(400).json({ success: false, error: `Unsupported provider: ${provider}` });
    }

    let modelId = '';
    if (provider === 'groq') modelId = 'llama-3.1-8b-instant';
    else if (provider === 'openrouter') modelId = 'meta-llama/llama-3.1-8b-instruct';
    else if (provider === 'nvidia') modelId = 'meta/llama-3.1-8b-instruct';
    else if (provider === 'huggingface') modelId = 'google/gemma-2-9b-it';

    const testResponse = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      })
    });

    if (!testResponse.ok) {
      await AuditLogModel.create({
        username,
        action: 'KEY_VALIDATE_FAILED',
        details: `Failed credentials check for provider ${provider.toUpperCase()}: status ${testResponse.status}`,
        status: 'FAILED'
      });
      return res.status(401).json({ success: false, error: `Validation query failed: HTTP status ${testResponse.status}` });
    }

    // 2. Save encrypted key to MongoDB settings
    const encrypted = encrypt(keyRaw);
    const keyField = `${provider}KeyEncrypted`;
    
    await UserSettingsModel.findOneAndUpdate(
      { username },
      { $set: { [`keys.${keyField}`]: encrypted } },
      { upsert: true }
    );

    await AuditLogModel.create({
      username,
      action: 'KEY_VALIDATE_SUCCESS',
      details: `Successfully validated and saved encrypted ${provider.toUpperCase()} credentials.`,
      status: 'SUCCESS'
    });

    return res.status(200).json({ success: true, message: `Validated and encrypted ${provider} credentials successfully.` });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
