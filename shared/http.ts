import type { IncomingMessage, ServerResponse } from 'node:http';

type HandlerResult = unknown;

interface ExpressLikeRes {
  status: (code: number) => ExpressLikeRes;
  json: (payload: unknown) => unknown;
  setHeader: (name: string, value: string | string[]) => void;
}

// Handler is intentionally loosely typed: individual API files declare their own
// req/res shape (ApiRequest/ApiResponse). Vercel hands the wrapper raw Node
// IncomingMessage/ServerResponse, while tests hand it Express-like mocks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: any, res: any) => HandlerResult | Promise<HandlerResult>;

function isExpressLikeRes(res: unknown): res is ExpressLikeRes {
  return (
    typeof res === 'object' &&
    res !== null &&
    typeof (res as ExpressLikeRes).status === 'function' &&
    typeof (res as ExpressLikeRes).json === 'function'
  );
}

function parseQuery(req: IncomingMessage): Record<string, string | string[] | undefined> {
  const raw = (req as IncomingMessage & { query?: Record<string, unknown> }).query;
  if (raw && typeof raw === 'object') {
    return raw as Record<string, string | string[] | undefined>;
  }
  const url = req.url || '';
  const qIndex = url.indexOf('?');
  const search = qIndex >= 0 ? url.slice(qIndex + 1) : '';
  const out: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of new URLSearchParams(search).entries()) {
    const existing = out[key];
    if (existing === undefined) {
      out[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      out[key] = [existing, value];
    }
  }
  return out;
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf8');
      if (raw.length > 1_000_000) {
        reject(new Error('Request body exceeds 1MB limit'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res: ServerResponse, payload: unknown) {
  if (res.writableEnded) return;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function vercelHandler(handler: Handler) {
  // Returns a loose (req, res) signature so both Vercel's raw Node objects and
  // tests' Express-like mocks are accepted by type checkers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, res: any): Promise<void> => {
    if (isExpressLikeRes(res)) {
      await handler(req, res);
      return;
    }

    const rawReq = req as IncomingMessage;
    const rawRes = res as ServerResponse;

    const expressRes: ExpressLikeRes = {
      status(code: number) {
        rawRes.statusCode = code;
        return expressRes;
      },
      json(payload: unknown) {
        jsonResponse(rawRes, payload);
        return payload;
      },
      setHeader(name: string, value: string | string[]) {
        rawRes.setHeader(name, value as string);
      }
    };

    let body: unknown = (rawReq as IncomingMessage & { body?: unknown }).body;
    if (body === undefined) {
      body = await readBody(rawReq).catch(() => ({}));
    }

    const expressReq = Object.assign(rawReq, { body, query: parseQuery(rawReq) }) as IncomingMessage & { body?: unknown; query?: Record<string, unknown> };

    try {
      await handler(expressReq, expressRes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (!rawRes.headersSent && !rawRes.writableEnded) {
        rawRes.statusCode = 500;
        jsonResponse(rawRes, { error: 'Server error', details: message });
      }
    }

    if (!rawRes.writableEnded) {
      rawRes.statusCode = rawRes.statusCode || 200;
      jsonResponse(rawRes, {});
    }
  };
}
