import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ANONYMOUS_LIMIT,
  parseApiKeys,
  resetAuthStateForTests,
  type AuthPlan,
} from '../src/auth.js';
import { createApp } from '../src/server.js';
import { SCHEMA_VERSION } from '../src/schema.js';

const testKeys = new Map<string, AuthPlan>([
  ['trk_live_builder_test', 'builder'],
  ['trk_live_free_test', 'free'],
]);

function search(app: ReturnType<typeof createApp>, headers: Record<string, string> = {}) {
  return app.request('http://localhost/v1/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ job: 'scrape website to markdown for RAG', limit: 2 }),
  });
}

describe('parseApiKeys', () => {
  it('parses key:plan and bare keys (default free)', () => {
    const map = parseApiKeys('trk_live_abc:builder,trk_live_xyz:free,trk_bare');
    expect(map.get('trk_live_abc')).toBe('builder');
    expect(map.get('trk_live_xyz')).toBe('free');
    expect(map.get('trk_bare')).toBe('free');
  });

  it('handles empty / whitespace', () => {
    expect(parseApiKeys(undefined).size).toBe(0);
    expect(parseApiKeys('').size).toBe(0);
    expect(parseApiKeys('  ,  ').size).toBe(0);
  });
});

describe('auth middleware', () => {
  beforeEach(() => {
    resetAuthStateForTests();
  });

  afterEach(() => {
    resetAuthStateForTests();
  });

  it('allows anonymous under limit', async () => {
    const app = createApp({ apiKeys: testKeys });
    const res = await search(app, { 'x-forwarded-for': '203.0.113.10' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema_version).toBe(SCHEMA_VERSION);
    expect(body.plan).toBeUndefined();
    expect(Array.isArray(body.results)).toBe(true);
  });

  it('health and openapi stay open without a key', async () => {
    const app = createApp({ apiKeys: testKeys });
    expect((await app.request('http://localhost/health')).status).toBe(200);
    expect((await app.request('http://localhost/openapi.json')).status).toBe(200);
  });

  it('rejects bad key with 401 envelope', async () => {
    const app = createApp({ apiKeys: testKeys });
    const res = await search(app, { Authorization: 'Bearer totally-wrong' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid api key/i);
    expect(body.schema_version).toBe(SCHEMA_VERSION);
    expect(typeof body.as_of).toBe('string');
  });

  it('accepts Bearer builder key and includes plan', async () => {
    const app = createApp({ apiKeys: testKeys });
    const res = await search(app, { Authorization: 'Bearer trk_live_builder_test' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan).toBe('builder');
  });

  it('accepts X-API-Key free key and includes plan', async () => {
    const app = createApp({ apiKeys: testKeys });
    const res = await search(app, { 'X-API-Key': 'trk_live_free_test' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan).toBe('free');
  });

  it('returns 429 with Retry-After when anonymous quota exceeded', async () => {
    const app = createApp({ apiKeys: testKeys });
    const ip = '198.51.100.77';
    for (let i = 0; i < ANONYMOUS_LIMIT; i++) {
      const ok = await search(app, { 'x-forwarded-for': ip });
      expect(ok.status).toBe(200);
    }
    const blocked = await search(app, { 'x-forwarded-for': ip });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    const body = await blocked.json();
    expect(body.error).toMatch(/quota/i);
    expect(body.schema_version).toBe(SCHEMA_VERSION);
  });

  it('good key still works after anonymous IP is exhausted', async () => {
    const app = createApp({ apiKeys: testKeys });
    const ip = '198.51.100.88';
    for (let i = 0; i < ANONYMOUS_LIMIT; i++) {
      expect((await search(app, { 'x-forwarded-for': ip })).status).toBe(200);
    }
    expect((await search(app, { 'x-forwarded-for': ip })).status).toBe(429);

    const keyed = await search(app, {
      'x-forwarded-for': ip,
      Authorization: 'Bearer trk_live_builder_test',
    });
    expect(keyed.status).toBe(200);
    expect((await keyed.json()).plan).toBe('builder');
  });
});
