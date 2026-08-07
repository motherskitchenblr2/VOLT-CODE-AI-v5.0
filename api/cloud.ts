import { OAuthProvider, getUsableAccessToken, OAUTH_PROVIDERS } from './utils/oauth.js';

type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
};

function getQueryString(req: ApiRequest, key: string): string {
  const value = req.query[key];
  return typeof value === 'string' ? value : '';
}

const GOOGLE_DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * GET /api/cloud/list?username=...&provider=google|microsoft&service=gmail|drive|onedrive|mail&max=10
 * Lists recent files/messages using the user's stored OAuth access token
 * (refreshing it automatically when expired).
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const username = getQueryString(req, 'username').trim();
  const provider = getQueryString(req, 'provider').toLowerCase() as OAuthProvider;
  const service = getQueryString(req, 'service').toLowerCase();
  const maxRaw = Number.parseInt(getQueryString(req, 'max') || '10', 10);
  const max = Number.isFinite(maxRaw) ? Math.min(Math.max(maxRaw, 1), 25) : 10;

  if (!username) {
    return res.status(400).json({ error: 'Username query parameter must be a non-empty string.' });
  }
  if (!OAUTH_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: `Unsupported provider. Allowed: ${OAUTH_PROVIDERS.join(', ')}` });
  }

  const accessToken = await getUsableAccessToken(username, provider);
  if (!accessToken) {
    return res.status(401).json({ error: 'Not connected', details: 'No OAuth tokens stored for this provider. Sign in first.' });
  }

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  try {
    if (provider === 'google' && service === 'drive') {
      const url = `${GOOGLE_DRIVE_BASE}/files?pageSize=${max}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)`;
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) return res.status(502).json({ error: 'Drive API error', details: await safeText(response) });
      const payload = (await response.json()) as { files?: Array<Record<string, unknown>> };
      return res.status(200).json({
        service: 'drive',
        items: (payload.files || []).map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          modifiedAt: f.modifiedTime,
          link: f.webViewLink,
        })),
      });
    }

    if (provider === 'google' && service === 'gmail') {
      const listUrl = `${GMAIL_BASE}/messages?maxResults=${max}&q=in:inbox`;
      const listRes = await fetch(listUrl, { headers: authHeaders });
      if (!listRes.ok) return res.status(502).json({ error: 'Gmail API error', details: await safeText(listRes) });
      const listPayload = (await listRes.json()) as { messages?: Array<{ id: string }> };

      const messages = [];
      for (const msg of listPayload.messages || []) {
        const metaRes = await fetch(
          `${GMAIL_BASE}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: authHeaders },
        );
        if (!metaRes.ok) continue;
        const meta = (await metaRes.json()) as {
          id: string;
          snippet?: string;
          internalDate?: string;
          payload?: { headers?: Array<{ name: string; value: string }> };
        };
        const headers = meta.payload?.headers || [];
        const pick = (name: string) => headers.find((h) => h.name === name)?.value || '';
        messages.push({
          id: meta.id,
          from: pick('From'),
          subject: pick('Subject'),
          date: pick('Date'),
          snippet: meta.snippet || '',
          internalDate: meta.internalDate,
        });
      }
      return res.status(200).json({ service: 'gmail', items: messages });
    }

    if (provider === 'microsoft' && (service === 'onedrive' || service === 'drive')) {
      const url = `${GRAPH_BASE}/me/drive/root/children?$top=${max}&$select=id,name,size,lastModifiedDateTime,webUrl,folder`;
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) return res.status(502).json({ error: 'OneDrive API error', details: await safeText(response) });
      const payload = (await response.json()) as { value?: Array<Record<string, unknown>> };
      return res.status(200).json({
        service: 'onedrive',
        items: (payload.value || []).map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          modifiedAt: f.lastModifiedDateTime,
          link: f.webUrl,
          isFolder: Boolean(f.folder),
        })),
      });
    }

    if (provider === 'microsoft' && service === 'mail') {
      const url = `${GRAPH_BASE}/me/mailFolders/inbox/messages?$top=${max}&$select=id,subject,from,receivedDateTime,bodyPreview`;
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) return res.status(502).json({ error: 'Outlook Mail API error', details: await safeText(response) });
      const payload = (await response.json()) as { value?: Array<Record<string, unknown>> };
      return res.status(200).json({
        service: 'mail',
        items: (payload.value || []).map((m) => ({
          id: m.id,
          subject: m.subject,
          from: (m.from as { emailAddress?: { name?: string; address?: string } } | undefined)
            ?.emailAddress,
          receivedAt: m.receivedDateTime,
          preview: m.bodyPreview,
        })),
      });
    }

    return res.status(400).json({
      error: 'Unsupported service',
      details: `Provider ${provider} supports: ${provider === 'google' ? 'gmail, drive' : 'onedrive, mail'}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Cloud service request failed', details: message });
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return `HTTP ${response.status}`;
  }
}
