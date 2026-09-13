# ToolRank — agent guide

You are talking to a ToolRank instance. It returns a ranked shortlist of MCP servers / HTTP APIs for a job description.

**Honesty:** Ranking is **lexical** (token overlap on tags/name/description plus small budget/health/MCP boosts). Catalog is **36 curated tools**, not the whole ecosystem. `health` is **often `unknown`** unless `check_health` is set (and even then only marks reachable hosts `up`). **Stripe is not wired.** No sponsored placement.

## Base URL

Production: `https://toolrank.onrender.com`

Local: `http://127.0.0.1:8787` (`$HOST` defaults to `0.0.0.0`, `$PORT` default `8787`).

## When to call

Use ToolRank when you need to **choose tools** (scrape, search, browser, integrations, DB, etc.) rather than inventing package names.

## HTTP

### Auth

| Mode | Headers | Limit (process-local, rolling 24h) |
|------|---------|-------------------------------------|
| Anonymous | none | 20 / IP on `/v1/*` and `/mcp` |
| Free key | `Authorization: Bearer <key>` **or** `X-API-Key: <key>` | 100 / key |
| Builder key | same | 2000 / key |

Keys come from env `TOOLRANK_API_KEYS` (`key` or `key:plan`, plans `free`|`builder`). `/health` and `/openapi.json` are always open.

- `401` invalid key → `{ error, schema_version, as_of }`
- `429` over quota → same shape + `Retry-After` header

### Search

```http
POST /v1/search
Content-Type: application/json
Authorization: Bearer trk_live_…
# or: X-API-Key: trk_live_…

{
  "job": "scrape website to markdown for RAG",
  "constraints": { "budget": "free", "runtime": "mcp" },
  "limit": 5,
  "check_health": false
}
```

Every successful JSON body includes `schema_version` (currently `0.1.0`) and `as_of` (ISO-8601 response time). When a valid key was used, search also includes `plan` (`free`|`builder`).

Response `results[]` fields: `id`, `name`, `url`, `interface`, `price_band`, `tags`, `description`, `install`, `health`, `score`, `reasons`.

### Detail / fresh / discovery

- `GET /v1/tools/{id}`
- `GET /v1/fresh?since=2026-01-01T00:00:00.000Z`
- `GET /openapi.json` — OpenAPI 3.1
- `GET /health` — liveness + catalog meta

## MCP

### Streamable HTTP (hosted)

`https://toolrank.onrender.com/mcp` — same auth/quota as `/v1/*`. Local: `http://127.0.0.1:8787/mcp`.

### stdio (local)

`npm run mcp`

| Tool | Args | Purpose |
|------|------|---------|
| `search_tools` | `job`, optional `budget`, `auth`, `runtime`, `limit` | Ranked shortlist |
| `get_tool` | `id` | Full catalog entry |
| `list_fresh` | optional `since` | Recently updated entries |

## Ranking honesty

Scores come from lexical overlap with tags/name/description, small budget/health boosts, and a tiny MCP preference. There is **no** sponsored ranking. `health` defaults to `unknown`; optional `check_health` only marks reachable hosts `up` (never speculative `down`).

## Install discipline

Before telling the user to install something, surface the `install` string and `price_band`. Prefer `free` / `freemium` when constraints say so.
