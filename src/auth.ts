import type { Context, MiddlewareHandler, Next } from 'hono';
import { SCHEMA_VERSION } from './schema.js';

export type AuthPlan = 'free' | 'builder';
export type EffectivePlan = AuthPlan | 'anonymous';

export const ANONYMOUS_LIMIT = 20;
export const FREE_KEY_LIMIT = 100;
export const BUILDER_LIMIT = 2000;
export const WINDOW_MS = 24 * 60 * 60 * 1000;

type QuotaBucket = { timestamps: number[] };

/** Process-local rolling windows — fine for single-instance MVP; resets on restart. */
const anonymousByIp = new Map<string, QuotaBucket>();
const keyedById = new Map<string, QuotaBucket>();

export type AuthVariables = {
  authPlan: AuthPlan | null;
  authKey: string | null;
};

function errorBody(error: string) {
  return {
    error,
    schema_version: SCHEMA_VERSION,
    as_of: new Date().toISOString(),
  };
}

function planLimit(plan: EffectivePlan): number {
  if (plan === 'builder') return BUILDER_LIMIT;
  if (plan === 'free') return FREE_KEY_LIMIT;
  return ANONYMOUS_LIMIT;
}

/** Parse TOOLRANK_API_KEYS: comma-separated `key` or `key:plan` (plan free|builder). Default plan = free. */
export function parseApiKeys(raw: string | undefined = process.env.TOOLRANK_API_KEYS): Map<string, AuthPlan> {
  const map = new Map<string, AuthPlan>();
  if (!raw?.trim()) return map;
  for (const part of raw.split(',')) {
    const token = part.trim();
    if (!token) continue;
    const colon = token.lastIndexOf(':');
    if (colon > 0) {
      const key = token.slice(0, colon).trim();
      const planRaw = token.slice(colon + 1).trim().toLowerCase();
      if (!key) continue;
      const plan: AuthPlan = planRaw === 'builder' ? 'builder' : 'free';
      map.set(key, plan);
    } else {
      map.set(token, 'free');
    }
  }
  return map;
}

export function extractApiKey(c: Context): string | null {
  const auth = c.req.header('Authorization');
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m?.[1]) return m[1].trim();
  }
  const x = c.req.header('X-API-Key') ?? c.req.header('x-api-key');
  if (x?.trim()) return x.trim();
  return null;
}

export function getClientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for') ?? c.req.header('X-Forwarded-For');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = c.req.header('x-real-ip') ?? c.req.header('X-Real-IP');
  if (real?.trim()) return real.trim();
  return 'unknown';
}

function pruneAndCount(bucket: QuotaBucket, now: number): number {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
  return bucket.timestamps.length;
}

function retryAfterSeconds(bucket: QuotaBucket, now: number): number {
  if (bucket.timestamps.length === 0) return 1;
  const oldest = Math.min(...bucket.timestamps);
  return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}

/**
 * Check/consume one request against the rolling 24h window.
 * Returns null if allowed, or { retryAfter } if over quota.
 */
export function consumeQuota(
  store: Map<string, QuotaBucket>,
  id: string,
  limit: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfter: number } {
  let bucket = store.get(id);
  if (!bucket) {
    bucket = { timestamps: [] };
    store.set(id, bucket);
  }
  const count = pruneAndCount(bucket, now);
  if (count >= limit) {
    return { ok: false, retryAfter: retryAfterSeconds(bucket, now) };
  }
  bucket.timestamps.push(now);
  return { ok: true };
}

/** Auth + soft rate limits for `/v1/*` and `/mcp`. `/health` and `/openapi.json` are not covered. */
export function authMiddleware(options?: {
  keys?: Map<string, AuthPlan>;
}): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next: Next) => {
    const keys = options?.keys ?? parseApiKeys();
    const presented = extractApiKey(c);

    c.set('authPlan', null);
    c.set('authKey', null);

    if (presented) {
      const plan = keys.get(presented);
      if (!plan) {
        return c.json(errorBody('Invalid API key'), 401);
      }
      const limit = planLimit(plan);
      const result = consumeQuota(keyedById, presented, limit);
      if (!result.ok) {
        c.header('Retry-After', String(result.retryAfter));
        return c.json(
          errorBody(`Rate limit exceeded for ${plan} plan (${limit} requests / 24h, process-local)`),
          429,
        );
      }
      c.set('authPlan', plan);
      c.set('authKey', presented);
      return next();
    }

    // Anonymous free tier
    const ip = getClientIp(c);
    const result = consumeQuota(anonymousByIp, ip, ANONYMOUS_LIMIT);
    if (!result.ok) {
      c.header('Retry-After', String(result.retryAfter));
      return c.json(
        errorBody(
          `Anonymous quota exceeded (${ANONYMOUS_LIMIT} requests / 24h per IP). Provide Authorization: Bearer <key> or X-API-Key.`,
        ),
        429,
      );
    }
    return next();
  };
}

/** Clear in-memory quota maps (tests only). */
export function resetAuthStateForTests(): void {
  anonymousByIp.clear();
  keyedById.clear();
}
