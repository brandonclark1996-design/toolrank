import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetAuthStateForTests, type AuthPlan } from '../src/auth.js';
import { MCP_TOOLS } from '../src/mcp-core.js';
import { createApp } from '../src/server.js';

const testKeys = new Map<string, AuthPlan>([['trk_live_builder_test', 'builder']]);

const mcpHeaders = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};

function parseSseOrJson(text: string, contentType: string | null): unknown {
  if (contentType?.includes('text/event-stream')) {
    const lines = text.split('\n').filter((l) => l.startsWith('data: '));
    const last = lines.at(-1);
    if (!last) return null;
    return JSON.parse(last.slice(6));
  }
  return JSON.parse(text);
}

async function mcpRpc(
  app: ReturnType<typeof createApp>,
  body: unknown,
  extraHeaders: Record<string, string> = {},
) {
  const res = await app.request('http://localhost/mcp', {
    method: 'POST',
    headers: { ...mcpHeaders, ...extraHeaders },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return {
    status: res.status,
    json: parseSseOrJson(text, res.headers.get('content-type')) as Record<string, unknown> | null,
    raw: text,
  };
}

describe('Streamable HTTP /mcp', () => {
  beforeEach(() => {
    resetAuthStateForTests();
  });

  afterEach(() => {
    resetAuthStateForTests();
  });

  it('initialize returns server info and tools capability', async () => {
    const app = createApp({ apiKeys: testKeys });
    const { status, json } = await mcpRpc(app, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'vitest', version: '0.0.0' },
      },
    });
    expect(status).toBe(200);
    expect(json).toBeTruthy();
    expect(json?.jsonrpc).toBe('2.0');
    const result = json?.result as { serverInfo?: { name: string }; capabilities?: { tools?: unknown } };
    expect(result?.serverInfo?.name).toBe('toolrank');
    expect(result?.capabilities?.tools).toBeDefined();
  });

  it('tools/list exposes search_tools, get_tool, list_fresh', async () => {
    const app = createApp({ apiKeys: testKeys });
    const { status, json } = await mcpRpc(app, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    expect(status).toBe(200);
    const result = json?.result as { tools?: Array<{ name: string }> };
    const names = (result?.tools ?? []).map((t) => t.name);
    expect(names).toEqual(MCP_TOOLS.map((t) => t.name));
  });

  it('tools/call search_tools returns a ranked envelope', async () => {
    const app = createApp({ apiKeys: testKeys });
    const { status, json } = await mcpRpc(app, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_tools',
        arguments: { job: 'scrape website to markdown for RAG', limit: 3 },
      },
    });
    expect(status).toBe(200);
    const result = json?.result as {
      content?: Array<{ type: string; text: string }>;
      isError?: boolean;
    };
    expect(result?.isError).toBeFalsy();
    const payload = JSON.parse(result?.content?.[0]?.text ?? '{}');
    expect(payload.schema_version).toBe('0.1.0');
    expect(Array.isArray(payload.results)).toBe(true);
    expect(payload.results.length).toBeGreaterThan(0);
  });

  it('rejects invalid API key with 401', async () => {
    const app = createApp({ apiKeys: testKeys });
    const res = await app.request('http://localhost/mcp', {
      method: 'POST',
      headers: { ...mcpHeaders, Authorization: 'Bearer totally-wrong' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid api key/i);
  });
});
