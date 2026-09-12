import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, type AuthPlan, type AuthVariables } from './auth.js';
import { catalogMeta, getToolById, listFresh, loadCatalog } from './catalog.js';
import { enrichHealth } from './health.js';
import { openApiSpec } from './openapi.js';
import { rankTools } from './ranking.js';
import { responseEnvelope } from './schema.js';
import { SearchBodySchema } from './types.js';

export type AppEnv = { Variables: AuthVariables };

export function createApp(options?: { apiKeys?: Map<string, AuthPlan> }) {
  const app = new Hono<AppEnv>();
  app.use('*', cors());

  app.get('/health', (c) => {
    loadCatalog();
    return c.json(responseEnvelope({ ok: true, service: 'toolrank', catalog: catalogMeta() }));
  });

  app.get('/openapi.json', (c) => c.json(openApiSpec));

  // Auth + soft quotas for all /v1/* routes (health + openapi stay open)
  app.use('/v1/*', authMiddleware(options?.apiKeys ? { keys: options.apiKeys } : undefined));

  app.post('/v1/search', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }
    const parsed = SearchBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const catalog = loadCatalog();
    let results = rankTools(catalog.tools, parsed.data);

    if (parsed.data.check_health) {
      try {
        results = await enrichHealth(results, 3);
      } catch {
        // health is optional — never fail the search
      }
    }

    const authPlan = c.get('authPlan');
    const payload: Record<string, unknown> = {
      job: parsed.data.job,
      constraints: parsed.data.constraints ?? null,
      count: results.length,
      results: results.map((r) => ({
        id: r.id,
        name: r.name,
        url: r.url,
        interface: r.interface,
        price_band: r.price_band,
        tags: r.tags,
        description: r.description,
        install: r.install,
        health: r.health,
        updated_at: r.updated_at,
        score: Math.round(r.score * 100) / 100,
        reasons: r.reasons,
      })),
    };
    if (authPlan) {
      payload.plan = authPlan;
    }

    return c.json(responseEnvelope(payload));
  });

  app.get('/v1/tools/:id', (c) => {
    const tool = getToolById(c.req.param('id'));
    if (!tool) return c.json({ error: 'Tool not found' }, 404);
    return c.json(responseEnvelope({ tool }));
  });

  app.get('/v1/fresh', (c) => {
    const since = c.req.query('since');
    try {
      const tools = listFresh(since || undefined);
      return c.json(responseEnvelope({ since: since ?? null, count: tools.length, tools }));
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'Bad since' }, 400);
    }
  });

  return app;
}
