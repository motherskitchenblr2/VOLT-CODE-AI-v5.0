import { describe, it, expect, vi, afterEach } from 'vitest';
import handler from '../../../api/models';

function makeReq(query: Record<string, string | string[] | undefined> = {}) {
  return { method: 'GET', query };
}

function makeRes() {
  const res = {
    _status: 0,
    _json: null as unknown,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(data: unknown) {
      this._json = data;
      return this;
    },
  };
  return res;
}

function stubFetch(handlerForUrl: (url: string) => { ok: boolean; json: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockImplementation((input: unknown) => {
    const url = String(input);
    return Promise.resolve(handlerForUrl(url));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api/models live availability', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns 405 for non-GET requests', async () => {
    const req = { method: 'POST', query: {} };
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect((res._json as { error: string }).error).toBe('Method not allowed');
  });

  it('classifies OpenRouter free vs paid models using real provider pricing', async () => {
    stubFetch((url) => {
      if (url.includes('openrouter.ai')) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 'meta/llama-3.3-70b-instruct:free',
                name: 'Llama 3.3 70B (free)',
                context_length: 131072,
                pricing: { prompt: '0', completion: '0' },
              },
              {
                id: 'anthropic/claude-3.7-sonnet',
                name: 'Claude 3.7 Sonnet',
                context_length: 200000,
                pricing: { prompt: '0.000003', completion: '0.000015' },
              },
            ],
          }),
        };
      }
      return { ok: true, json: async () => ({ data: [] }) };
    });

    const res = makeRes();
    await handler(makeReq({ provider: 'openrouter' }), res);
    expect(res._status).toBe(200);
    const body = res._json as {
      results: Array<{ freeCount: number; paidCount: number; models: Array<{ tier: string }> }>;
    };
    expect(body.results).toHaveLength(1);
    expect(body.results[0].freeCount).toBe(1);
    expect(body.results[0].paidCount).toBe(1);
    expect(body.results[0].models[0].tier).toBe('FREE');
    expect(body.results[0].models[1].tier).toBe('PAID');
  });

  it('marks all Groq models as FREE (Groq serves a free tier)', async () => {
    stubFetch((url) => {
      if (url.includes('groq.com')) {
        return {
          ok: true,
          json: async () => ({
            data: [
              { id: 'llama-3.3-70b-versatile', owned_by: 'groq' },
              { id: 'llama-3.1-8b-instant', owned_by: 'groq' },
            ],
          }),
        };
      }
      return { ok: true, json: async () => ({ data: [] }) };
    });

    const res = makeRes();
    await handler(makeReq({ provider: 'groq', key: 'gsk_test' }), res);
    expect(res._status).toBe(200);
    const body = res._json as {
      results: Array<{ connected: boolean; freeCount: number; paidCount: number }>;
    };
    expect(body.results[0].connected).toBe(true);
    expect(body.results[0].freeCount).toBe(2);
    expect(body.results[0].paidCount).toBe(0);
  });

  it('returns empty (offline) when a provider requires a key but none is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    const res = makeRes();
    await handler(makeReq({ provider: 'groq' }), res);
    const body = res._json as {
      results: Array<{ connected: boolean; freeCount: number; paidCount: number }>;
    };
    expect(body.results[0].connected).toBe(false);
    expect(body.results[0].freeCount).toBe(0);
  });

  it('rejects an unsupported provider with 400', async () => {
    const res = makeRes();
    await handler(makeReq({ provider: 'unknown' }), res);
    expect(res._status).toBe(400);
  });

  it('handles a single key value passed as a string query param', async () => {
    stubFetch((url) => {
      if (url.includes('groq.com')) {
        return { ok: true, json: async () => ({ data: [{ id: 'llama-3.3-70b-versatile' }] }) };
      }
      return { ok: true, json: async () => ({ data: [] }) };
    });

    const res = makeRes();
    await handler(makeReq({ provider: 'groq', key: 'gsk_single' }), res);
    const body = res._json as {
      results: Array<{ connected: boolean }>;
    };
    expect(body.results[0].connected).toBe(true);
  });
});
