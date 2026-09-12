# Catalog ingest (stub)

Future: pull from the official MCP registry and merge into `data/catalog.json`.

## Source

- Registry: https://registry.modelcontextprotocol.io
- Related discovery UIs: Smithery, Glama

## Planned steps

1. `GET` registry list/search endpoints (confirm current OpenAPI when implementing).
2. Map registry records → ToolRank schema:
   - `id`, `name`, `url`, `interface` (usually `mcp`), `price_band` (`unknown` unless known),
   - `tags` from categories/keywords, `description`, `install` from package hints,
   - `health: unknown`, `updated_at` from registry timestamps.
3. Dedupe by `id` / homepage URL against the hand-curated catalog.
4. Write merged JSON; never overwrite curated `price_band` / `install` without review.
5. Optional: schedule via cron; keep ingest offline-friendly for this private MVP.

## Non-goals (MVP)

- No publish pipeline
- No Stripe / billing sync
- No automatic trust scoring beyond optional HTTP probe

## CLI sketch (not implemented)

```bash
# npm run ingest -- --since 2026-01-01
# → scripts/ingest-registry.ts (TODO)
```
