import { serve } from '@hono/node-server';
import { createApp } from './server.js';
import { loadCatalog, catalogMeta } from './catalog.js';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '0.0.0.0';
loadCatalog();
const meta = catalogMeta();
const app = createApp();

console.log(`ToolRank listening on http://${host}:${port}`);
console.log(`Catalog v${meta.version}: ${meta.count} tools (updated ${meta.updated_at})`);

serve({ fetch: app.fetch, port, hostname: host });
