import { describe, expect, it } from 'vitest';
import { createApp } from '../src/server.js';
import { SCHEMA_VERSION } from '../src/schema.js';

describe('API envelope', () => {
  it('search returns schema_version and as_of', async () => {
    const app = createApp();
    const res = await app.request('http://localhost/v1/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ job: 'scrape website to markdown for RAG', limit: 3 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema_version).toBe(SCHEMA_VERSION);
    expect(typeof body.as_of).toBe('string');
    expect(() => new Date(body.as_of).toISOString()).not.toThrow();
    expect(Array.isArray(body.results)).toBe(true);
  });

  it('health returns schema_version', async () => {
    const app = createApp();
    const res = await app.request('http://localhost/health');
    const body = await res.json();
    expect(body.schema_version).toBe(SCHEMA_VERSION);
    expect(body.ok).toBe(true);
  });
});
