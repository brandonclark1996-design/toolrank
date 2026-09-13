# ToolRank (private MVP → public-ready deploy)

Ranked shortlist of **MCP servers / APIs** for agent jobs — health, `price_band`, and install snippet.

**Live:** [https://toolrank.onrender.com](https://toolrank.onrender.com) — OpenAPI at [`/openapi.json`](https://toolrank.onrender.com/openapi.json), Streamable HTTP MCP at [`/mcp`](https://toolrank.onrender.com/mcp).

Private build for Brandon Clark / ToolRank. **All Rights Reserved** (see `LICENSE`). GitHub: [brandonclark1996-design/toolrank](https://github.com/brandonclark1996-design/toolrank).

**Honesty:** Ranking is lexical (token overlap), not learned or sponsored. Catalog is **36 curated tools**. `health` is often `unknown`. **Stripe is not wired.** Custom domain is not purchased.

## Stack

- Node 20, TypeScript
- [Hono](https://hono.dev) HTTP API
- Zod validation
- JSON catalog (`data/catalog.json`, 36 curated public tools)
- MCP stdio (`npm run mcp`) and Streamable HTTP (`POST /mcp`) via `@modelcontextprotocol/sdk`
- API-key auth + process-local soft quotas (`src/auth.ts`) on `/v1/*` and `/mcp`

## Quick start (local)

```bash
cd /workspace/toolrank
cp .env.example .env
# Edit .env — set TOOLRANK_API_KEYS if you want keyed access locally
export TOOLRANK_API_KEYS='trk_live_test:builder'
npm install
npm test
npm run build
npm start              # listens on 0.0.0.0:$PORT (default 8787)
# or: npm run dev
```

### Local curl with a test key

```bash
export TOOLRANK_API_KEYS='trk_live_test:builder'
npm start

curl -s http://127.0.0.1:8787/health | jq .

curl -s http://127.0.0.1:8787/v1/search \
  -H 'content-type: application/json' \
  -H 'Authorization: Bearer trk_live_test' \
  -d '{"job":"scrape website to markdown for RAG","constraints":{"budget":"any"},"limit":5}' | jq .

# Or X-API-Key:
curl -s http://127.0.0.1:8787/v1/search \
  -H 'content-type: application/json' \
  -H 'X-API-Key: trk_live_test' \
  -d '{"job":"web search for research","limit":3}' | jq .
```

Anonymous (no key) works until the free IP quota is hit (20 / rolling 24h).

## Auth + limits

| Caller | How | Soft limit (process-local, rolling 24h) |
|--------|-----|----------------------------------------|
| Anonymous | No key | 20 req / IP to `/v1/*` and `/mcp` |
| `free` key | `Authorization: Bearer <key>` or `X-API-Key: <key>` | 100 / key |
| `builder` key | same headers | 2000 / key |

- Env: `TOOLRANK_API_KEYS` = comma-separated keys, optional `key:plan` (`free` \| `builder`). Example: `trk_live_abc:builder,trk_live_xyz:free`. Bare key → `free`.
- `/health` and `/openapi.json` are always open (no auth / no quota).
- Invalid key → `401` `{ error, schema_version, as_of }`
- Over quota → `429` + `Retry-After` (seconds hint)
- Authed `POST /v1/search` responses include `plan` (`free` \| `builder`)
- Quotas are **in-memory / process-local** — fine for single-instance MVP; they reset on restart and do not sync across replicas.

### Setting keys on the host (Brandon)

Do **not** commit real keys. Set `TOOLRANK_API_KEYS` in the host environment:

1. **Render:** Dashboard → your Web Service → Environment → add `TOOLRANK_API_KEYS` = `trk_live_….…:builder,…` (use `sync: false` / secret). Redeploy.
2. **Railway:** Service → Variables → `TOOLRANK_API_KEYS`.
3. **Docker / VPS:** `-e TOOLRANK_API_KEYS='…'` or systemd/env file outside git.
4. **Local:** `export TOOLRANK_API_KEYS='trk_live_test:builder'` before `npm start`.

Also set `HOST=0.0.0.0` (default in code) and let the platform inject `PORT`.

## HTTP API

Base: `https://toolrank.onrender.com` (or `http://127.0.0.1:8787` locally).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + catalog meta (open) |
| POST | `/v1/search` | Rank tools for a job (auth/quota) |
| GET | `/v1/tools/:id` | Tool detail (auth/quota) |
| GET | `/v1/fresh?since=` | Updated since ISO timestamp (auth/quota) |
| GET | `/openapi.json` | OpenAPI 3.1 (open) |
| ALL | `/mcp` | Streamable HTTP MCP (auth/quota; same tools as stdio) |

### Search body

```json
{
  "job": "string (required)",
  "constraints": {
    "budget": "free | paid | any",
    "auth": "optional hint",
    "runtime": "mcp | api | …"
  },
  "limit": 10,
  "check_health": false
}
```

Optional `check_health: true` probes top results (2s timeout). Failures stay `unknown` (no false `down`).

## Deploy (no custom domain / no Stripe)

### Docker

```bash
docker build -t toolrank .
docker run --rm -p 8787:8787 \
  -e TOOLRANK_API_KEYS='trk_live_prod:builder' \
  toolrank
```

### Render

- Blueprint: `render.yaml` (Docker web service, free plan friendly).
- Live hostname: `https://toolrank.onrender.com` (no custom domain required).
- Set `TOOLRANK_API_KEYS` in the dashboard.

### Railway

- `railway.toml` (Dockerfile) or `Procfile` (`web: node dist/index.js` after build).
- Set `TOOLRANK_API_KEYS` in Variables. Use Railway’s public HTTP domain.

Build step for native Node hosts: `npm ci && npm run build` then `node dist/index.js`.

## MCP

Tools: `search_tools`, `get_tool`, `list_fresh` (shared handlers for stdio + HTTP).

### Streamable HTTP (production)

```
https://toolrank.onrender.com/mcp
```

Same API-key / anonymous quota as `/v1/*`. Official MCP Registry manifest: `server.json` (`io.github.brandonclark1996-design/toolrank`). Do not run `mcp-publisher` from this box unless asked.

Cursor / Claude HTTP MCP config snippet:

```json
{
  "mcpServers": {
    "toolrank": {
      "url": "https://toolrank.onrender.com/mcp"
    }
  }
}
```

### stdio (local)

```bash
npm run mcp
```

```json
{
  "mcpServers": {
    "toolrank": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/workspace/toolrank"
    }
  }
}
```

## Ranking

1. Tokenize `job` (drop stopwords).
2. Score tag / name / description matches.
3. Boost matching `price_band` under budget constraints.
4. Boost `health: up`; penalize `health: down`.
5. Tiny preference for `mcp` / `both` interfaces.

Honest lexical ranking — no paid placement. 36 curated tools. Health often unknown. Stripe not wired.

## Docs

- `docs/AGENT.md` — agent-readable usage (auth headers + limits)
- `docs/llms.txt` — compact machine summary
- `server.json` — Official MCP Registry manifest (not published yet)
- `scripts/README-ingest.md` — stub for future registry.modelcontextprotocol.io ingest

## Tests & build

```bash
npm test    # vitest — ranking, envelope, auth middleware, /mcp
npm run build
```

## TODO

- [ ] Implement registry ingest (`scripts/README-ingest.md`)
- [ ] Persist health probe results between restarts
- [ ] Stripe / paid upgrades (not started)
- [ ] Custom domain (not purchased / not wired)
- [ ] Shared Redis (or similar) quotas if multi-instance
- [ ] Publish `server.json` with mcp-publisher (not run from this change)

## License

All Rights Reserved — Brandon Clark / ToolRank. See `LICENSE`.
