import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogSchema, type Catalog, type Tool } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveCatalogPath(): string {
  // Prefer repo-root data/ whether running from src (tsx) or dist/
  const candidates = [
    join(__dirname, '..', 'data', 'catalog.json'),
    join(process.cwd(), 'data', 'catalog.json'),
  ];
  for (const p of candidates) {
    try {
      readFileSync(p, 'utf8');
      return p;
    } catch {
      /* try next */
    }
  }
  return candidates[0];
}

let cached: Catalog | null = null;

export function loadCatalog(force = false): Catalog {
  if (cached && !force) return cached;
  const raw = JSON.parse(readFileSync(resolveCatalogPath(), 'utf8'));
  cached = CatalogSchema.parse(raw);
  return cached;
}

export function getToolById(id: string): Tool | undefined {
  return loadCatalog().tools.find((t) => t.id === id);
}

export function listFresh(since?: string): Tool[] {
  const tools = loadCatalog().tools;
  if (!since) {
    return [...tools].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
  const sinceMs = Date.parse(since);
  if (Number.isNaN(sinceMs)) {
    throw new Error(`Invalid since timestamp: ${since}`);
  }
  return tools
    .filter((t) => Date.parse(t.updated_at) > sinceMs)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function catalogMeta() {
  const c = loadCatalog();
  return { version: c.version, updated_at: c.updated_at, count: c.tools.length };
}
