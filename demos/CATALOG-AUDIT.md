# ToolRank catalog audit

**Date:** 2026-09-12  
**Catalog:** `/workspace/toolrank/data/catalog.json` (36 tools, all IDs kept)  
**Method:** Public pages via HEAD/GET, official docs (WebFetch), npm/PyPI registry lookups, and official GitHub READMEs.  
**Schema:** No `verified_at` / `sources` / `notes` fields added. Existing Zod `ToolSchema` is unchanged.

## Summary

| Metric | Count |
|---|---|
| Tools in catalog | 36 (none removed) |
| Field corrections applied | 36 |
| Fields left UNVERIFIED | 2 |
| Audit rows (all checks) | 128 |
| Tags | FACT=114, INFERENCE=12, GUESS=0, UNVERIFIED=2 |

### Notable findings

- Several official MCP *reference* servers were **archived** (`brave-search`, `github`, `postgres`, `puppeteer`, `slack`, `sqlite`). Install strings that pointed at `@modelcontextprotocol/server-*` were replaced with official successors or `See https://...` docs URLs.
- `@modelcontextprotocol/server-fetch` and `@modelcontextprotocol/server-sqlite` **do not exist on npm**. Official install is Python/`uvx`.
- `npx -y duckduckgo-mcp-server` is a **different unofficial npm package** (zhsama). The catalog GitHub repo (`nickclyde`) documents `uvx duckduckgo-mcp-server`.
- Anthropic catalog URL `/docs/agents-and-tools/mcp` **redirects to modelcontextprotocol.io** (wrong product page). Updated to the MCP connector docs.
- Bright Data MCP has a **5,000 free requests/month** tier → `price_band` paid→freemium. Context7 has a paid Pro plan → free→freemium.
- OpenAI **Assistants API shut down 2026-08-26**. ID kept; description/docs point at Responses API.
- Health probe treats any HTTP status as `up`, so API roots that 404 (Exa, Apify, Bright Data, Perplexity, Stripe) were left in place and tagged INFERENCE.
- Browserless `https://chrome.browserless.io` returned **502**; health_url moved to the public site.
- `https://parallel.ai/docs` is **404**; install now points at `https://docs.parallel.ai`.
- No products were removed. No publish/deploy/Stripe/domain work.

## Corrections (old ≠ new)

| id | field | old | new | tag | source URL |
|---|---|---|---|---|---|
| tavily | url | https://tavily.com | https://www.tavily.com | FACT | https://tavily.com |
| context7 | price_band | free | freemium | FACT | https://context7.com/plans |
| brightdata | price_band | paid | freemium | FACT | https://docs.brightdata.com/products/mcp-server/overview |
| parallel | install | See https://parallel.ai/docs — REST API with API key | See https://docs.parallel.ai — REST API with API key | FACT | https://docs.parallel.ai |
| brave-search | install | npx -y @modelcontextprotocol/server-brave-search | npx -y @brave/brave-search-mcp-server | FACT | https://github.com/brave/brave-search-mcp-server |
| puppeteer-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/puppeteer | FACT | https://github.com/modelcontextprotocol/servers |
| fetch-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch | FACT | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch |
| fetch-mcp | install | npx -y @modelcontextprotocol/server-fetch | uvx mcp-server-fetch | FACT | https://github.com/modelcontextprotocol/servers/blob/main/src/fetch/README.md |
| github-mcp | install | npx -y @modelcontextprotocol/server-github | See https://github.com/github/github-mcp-server — remote https://api.githubcopilot.com/mcp/ or docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server | FACT | https://github.com/github/github-mcp-server |
| filesystem-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem | FACT | https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem |
| memory-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers/tree/main/src/memory | FACT | https://github.com/modelcontextprotocol/servers/tree/main/src/memory |
| sqlite-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite | FACT | https://github.com/modelcontextprotocol/servers |
| sqlite-mcp | install | npx -y @modelcontextprotocol/server-sqlite /path/to/db.sqlite | uvx mcp-server-sqlite --db-path /path/to/db.sqlite | FACT | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite |
| postgres-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/crystaldba/postgres-mcp | FACT | https://github.com/modelcontextprotocol/servers |
| postgres-mcp | install | npx -y @modelcontextprotocol/server-postgres postgresql://... | See https://github.com/crystaldba/postgres-mcp | FACT | https://github.com/crystaldba/postgres-mcp |
| slack-mcp | url | https://github.com/modelcontextprotocol/servers | https://docs.slack.dev/ai/slack-mcp-server/ | FACT | https://docs.slack.dev/ai/slack-mcp-server/ |
| slack-mcp | install | npx -y @modelcontextprotocol/server-slack | See https://docs.slack.dev/ai/slack-mcp-server/ — remote https://mcp.slack.com/mcp | FACT | https://docs.slack.dev/ai/slack-mcp-server/ |
| notion-api | install | REST API — https://developers.notion.com; Notion MCP community servers available | See https://developers.notion.com/guides/mcp/get-started-with-mcp — remote https://mcp.notion.com/mcp | FACT | https://developers.notion.com/guides/mcp/get-started-with-mcp |
| notion-api | interface | api | both | FACT | https://developers.notion.com/guides/mcp/get-started-with-mcp |
| browserless | install | REST/WebSocket — https://www.browserless.io/docs | REST/WebSocket — https://docs.browserless.io | FACT | https://www.browserless.io/docs |
| browserless | health_url | https://chrome.browserless.io | https://www.browserless.io | FACT | https://chrome.browserless.io |
| scrapingbee | price_band | freemium | unknown | UNVERIFIED | https://www.scrapingbee.com/pricing/ |
| crawl4ai | install | pip install crawl4ai && crawl4ai-setup — self-host HTTP API | pip install -U crawl4ai && crawl4ai-setup | FACT | https://github.com/unclecode/crawl4ai |
| supabase-mcp | url | https://supabase.com/docs/guides/getting-started/mcp | https://supabase.com/docs/guides/ai-tools/mcp | FACT | https://supabase.com/docs/guides/getting-started/mcp |
| supabase-mcp | install | npx -y @supabase/mcp-server-supabase@latest | See https://supabase.com/docs/guides/ai-tools/mcp — remote https://mcp.supabase.com/mcp | FACT | https://supabase.com/docs/guides/ai-tools/mcp |
| linear-mcp | url | https://linear.app | https://linear.app/docs/mcp | FACT | https://linear.app/docs/mcp |
| linear-mcp | install | Community/official Linear MCP — see Linear docs or Smithery for install | npx -y mcp-remote https://mcp.linear.app/mcp | FACT | https://linear.app/docs/mcp |
| stripe-api | url | https://stripe.com/docs/api | https://docs.stripe.com/api | FACT | https://stripe.com/docs/api |
| stripe-api | price_band | freemium | unknown | UNVERIFIED | https://docs.stripe.com/api |
| stripe-api | install | Official SDKs — https://stripe.com/docs/api; Stripe MCP community servers exist | Official SDKs — https://docs.stripe.com/api | FACT | https://docs.stripe.com/api |
| openai-assistants | url | https://platform.openai.com/docs | https://developers.openai.com/api/docs | FACT | https://platform.openai.com/docs |
| openai-assistants | description | OpenAI platform APIs for chat, tools, file search, and assistants. Meta tooling for agents. | OpenAI platform APIs for chat, tools, file search, and the Responses API. Assistants API shut down 2026-08-26; use Responses + Conversations. | FACT | https://developers.openai.com/api/docs/assistants/migration |
| openai-assistants | install | openai Python/JS SDK — https://platform.openai.com/docs | openai Python/JS SDK — https://developers.openai.com/api/docs | FACT | https://developers.openai.com/api/docs |
| anthropic-mcp | url | https://docs.anthropic.com/en/docs/agents-and-tools/mcp | https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector | FACT | https://docs.anthropic.com/en/docs/agents-and-tools/mcp |
| anthropic-mcp | install | Configure MCP in Claude Desktop / API — see Anthropic MCP docs | See https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector — Messages API mcp_servers / Claude Desktop | FACT | https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector |
| duckduckgo-search | install | npx -y duckduckgo-mcp-server | uvx duckduckgo-mcp-server | FACT | https://github.com/nickclyde/duckduckgo-mcp-server |

## UNVERIFIED

| id | field | old | new | tag | source URL |
|---|---|---|---|---|---|
| scrapingbee | price_band | freemium | unknown | UNVERIFIED | https://www.scrapingbee.com/pricing/ |
| stripe-api | price_band | freemium | unknown | UNVERIFIED | https://docs.stripe.com/api |

- **scrapingbee.price_band:** Official pricing page enumerates paid plans. Marketing copy mentions 1,000 credits. Could not confirm from the pricing HTML whether that is a lasting free tier or a one-time trial, so band set to `unknown`.
- **stripe-api.price_band:** Stripe API access has no subscription price; test mode is free and live charges are payment-processing fees. That does not map cleanly to free/freemium/paid, so band set to `unknown`.

## Full check log (every tool × field)

Includes unchanged-but-verified rows. `note` is extra context, not a catalog field.

| id | field | old | new | tag | source URL |
|---|---|---|---|---|---|
| firecrawl | url | https://www.firecrawl.dev | https://www.firecrawl.dev | FACT | https://www.firecrawl.dev |
| firecrawl | price_band | freemium | freemium | FACT | https://www.firecrawl.dev/pricing |
| firecrawl | install | npx -y firecrawl-mcp | npx -y firecrawl-mcp | FACT | https://github.com/firecrawl/firecrawl-mcp-server |
| firecrawl | health_url | https://api.firecrawl.dev | https://api.firecrawl.dev | FACT | https://api.firecrawl.dev |
| exa | url | https://exa.ai | https://exa.ai | FACT | https://exa.ai |
| exa | price_band | freemium | freemium | FACT | https://exa.ai/pricing |
| exa | install | npx -y exa-mcp-server | npx -y exa-mcp-server | FACT | https://exa.ai/docs/reference/exa-mcp |
| exa | health_url | https://api.exa.ai | https://api.exa.ai | INFERENCE | https://api.exa.ai |
| tavily | url | https://tavily.com | https://www.tavily.com | FACT | https://tavily.com |
| tavily | price_band | freemium | freemium | FACT | https://www.tavily.com/pricing |
| tavily | install | npx -y tavily-mcp | npx -y tavily-mcp | FACT | https://docs.tavily.com/documentation/mcp |
| tavily | health_url | https://api.tavily.com | https://api.tavily.com | FACT | https://api.tavily.com |
| browserbase | url | https://www.browserbase.com | https://www.browserbase.com | FACT | https://www.browserbase.com |
| browserbase | price_band | freemium | freemium | FACT | https://www.browserbase.com/pricing |
| browserbase | install | npx -y @browserbasehq/mcp | npx -y @browserbasehq/mcp | FACT | https://www.browserbase.com/mcp |
| browserbase | health_url | https://www.browserbase.com | https://www.browserbase.com | FACT | https://www.browserbase.com |
| apify | url | https://apify.com | https://apify.com | FACT | https://apify.com |
| apify | price_band | freemium | freemium | FACT | https://apify.com/pricing |
| apify | install | npx -y @apify/actors-mcp-server | npx -y @apify/actors-mcp-server | FACT | https://www.npmjs.com/package/@apify/actors-mcp-server |
| apify | health_url | https://api.apify.com | https://api.apify.com | INFERENCE | https://api.apify.com |
| composio | url | https://composio.dev | https://composio.dev | FACT | https://composio.dev |
| composio | price_band | freemium | freemium | FACT | https://composio.dev/pricing |
| composio | install | npx -y @composio/mcp | npx -y @composio/mcp | FACT | https://www.npmjs.com/package/@composio/mcp |
| composio | health_url | https://backend.composio.dev | https://backend.composio.dev | INFERENCE | https://backend.composio.dev |
| context7 | url | https://context7.com | https://context7.com | FACT | https://context7.com |
| context7 | price_band | free | freemium | FACT | https://context7.com/plans |
| context7 | install | npx -y @upstash/context7-mcp | npx -y @upstash/context7-mcp | FACT | https://www.npmjs.com/package/@upstash/context7-mcp |
| brightdata | url | https://brightdata.com | https://brightdata.com | FACT | https://brightdata.com |
| brightdata | price_band | paid | freemium | FACT | https://docs.brightdata.com/products/mcp-server/overview |
| brightdata | install | npx -y @brightdata/mcp | npx -y @brightdata/mcp | FACT | https://docs.brightdata.com/products/mcp-server/overview |
| brightdata | health_url | https://api.brightdata.com | https://api.brightdata.com | INFERENCE | https://api.brightdata.com |
| parallel | url | https://parallel.ai | https://parallel.ai | FACT | https://parallel.ai |
| parallel | price_band | freemium | freemium | FACT | https://parallel.ai/pricing |
| parallel | install | See https://parallel.ai/docs — REST API with API key | See https://docs.parallel.ai — REST API with API key | FACT | https://docs.parallel.ai |
| smithery | url | https://smithery.ai | https://smithery.ai | FACT | https://smithery.ai |
| smithery | price_band | freemium | freemium | FACT | https://smithery.ai/pricing |
| smithery | install | npx -y @smithery/cli | npx -y @smithery/cli | FACT | https://www.npmjs.com/package/@smithery/cli |
| smithery | health_url | https://smithery.ai | https://smithery.ai | FACT | https://smithery.ai |
| glama | url | https://glama.ai/mcp | https://glama.ai/mcp | FACT | https://glama.ai/mcp |
| glama | price_band | freemium | freemium | INFERENCE | https://glama.ai/pricing |
| glama | install | Browse https://glama.ai/mcp — connect via hosted gateway URLs | Browse https://glama.ai/mcp — connect via hosted gateway URLs | FACT | https://glama.ai/mcp |
| mcp-registry | url | https://registry.modelcontextprotocol.io | https://registry.modelcontextprotocol.io | FACT | https://registry.modelcontextprotocol.io |
| mcp-registry | price_band | free | free | FACT | https://registry.modelcontextprotocol.io |
| mcp-registry | install | GET https://registry.modelcontextprotocol.io — no local install; query registry API | GET https://registry.modelcontextprotocol.io — no local install; query registry API | FACT | https://registry.modelcontextprotocol.io/v0/servers |
| mcp-registry | health_url | https://registry.modelcontextprotocol.io | https://registry.modelcontextprotocol.io | FACT | https://registry.modelcontextprotocol.io |
| brave-search | url | https://brave.com/search/api | https://brave.com/search/api | FACT | https://brave.com/search/api/ |
| brave-search | price_band | freemium | freemium | FACT | https://brave.com/search/api |
| brave-search | install | npx -y @modelcontextprotocol/server-brave-search | npx -y @brave/brave-search-mcp-server | FACT | https://github.com/brave/brave-search-mcp-server |
| puppeteer-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/puppeteer | FACT | https://github.com/modelcontextprotocol/servers |
| puppeteer-mcp | price_band | free | free | FACT | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/puppeteer |
| puppeteer-mcp | install | npx -y @modelcontextprotocol/server-puppeteer | npx -y @modelcontextprotocol/server-puppeteer | INFERENCE | https://www.npmjs.com/package/@modelcontextprotocol/server-puppeteer |
| fetch-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch | FACT | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch |
| fetch-mcp | price_band | free | free | FACT | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch |
| fetch-mcp | install | npx -y @modelcontextprotocol/server-fetch | uvx mcp-server-fetch | FACT | https://github.com/modelcontextprotocol/servers/blob/main/src/fetch/README.md |
| github-mcp | url | https://github.com/github/github-mcp-server | https://github.com/github/github-mcp-server | FACT | https://github.com/github/github-mcp-server |
| github-mcp | price_band | free | free | FACT | https://github.com/github/github-mcp-server |
| github-mcp | install | npx -y @modelcontextprotocol/server-github | See https://github.com/github/github-mcp-server — remote https://api.githubcopilot.com/mcp/ or docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server | FACT | https://github.com/github/github-mcp-server |
| filesystem-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem | FACT | https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem |
| filesystem-mcp | price_band | free | free | FACT | https://github.com/modelcontextprotocol/servers/blob/main/README.md |
| filesystem-mcp | install | npx -y @modelcontextprotocol/server-filesystem /path/to/allowed | npx -y @modelcontextprotocol/server-filesystem /path/to/allowed | FACT | https://github.com/modelcontextprotocol/servers/blob/main/README.md |
| memory-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers/tree/main/src/memory | FACT | https://github.com/modelcontextprotocol/servers/tree/main/src/memory |
| memory-mcp | price_band | free | free | FACT | https://github.com/modelcontextprotocol/servers/blob/main/README.md |
| memory-mcp | install | npx -y @modelcontextprotocol/server-memory | npx -y @modelcontextprotocol/server-memory | FACT | https://github.com/modelcontextprotocol/servers/blob/main/README.md |
| sqlite-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite | FACT | https://github.com/modelcontextprotocol/servers |
| sqlite-mcp | price_band | free | free | FACT | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite |
| sqlite-mcp | install | npx -y @modelcontextprotocol/server-sqlite /path/to/db.sqlite | uvx mcp-server-sqlite --db-path /path/to/db.sqlite | FACT | https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite |
| postgres-mcp | url | https://github.com/modelcontextprotocol/servers | https://github.com/crystaldba/postgres-mcp | FACT | https://github.com/modelcontextprotocol/servers |
| postgres-mcp | price_band | free | free | FACT | https://github.com/crystaldba/postgres-mcp |
| postgres-mcp | install | npx -y @modelcontextprotocol/server-postgres postgresql://... | See https://github.com/crystaldba/postgres-mcp | FACT | https://github.com/crystaldba/postgres-mcp |
| slack-mcp | url | https://github.com/modelcontextprotocol/servers | https://docs.slack.dev/ai/slack-mcp-server/ | FACT | https://docs.slack.dev/ai/slack-mcp-server/ |
| slack-mcp | price_band | free | free | INFERENCE | https://docs.slack.dev/ai/slack-mcp-server/ |
| slack-mcp | install | npx -y @modelcontextprotocol/server-slack | See https://docs.slack.dev/ai/slack-mcp-server/ — remote https://mcp.slack.com/mcp | FACT | https://docs.slack.dev/ai/slack-mcp-server/ |
| notion-api | url | https://developers.notion.com | https://developers.notion.com | FACT | https://developers.notion.com |
| notion-api | price_band | freemium | freemium | FACT | https://developers.notion.com/guides/mcp/get-started-with-mcp |
| notion-api | install | REST API — https://developers.notion.com; Notion MCP community servers available | See https://developers.notion.com/guides/mcp/get-started-with-mcp — remote https://mcp.notion.com/mcp | FACT | https://developers.notion.com/guides/mcp/get-started-with-mcp |
| notion-api | interface | api | both | FACT | https://developers.notion.com/guides/mcp/get-started-with-mcp |
| notion-api | health_url | https://api.notion.com | https://api.notion.com | INFERENCE | https://api.notion.com |
| serpapi | url | https://serpapi.com | https://serpapi.com | FACT | https://serpapi.com |
| serpapi | price_band | freemium | freemium | FACT | https://serpapi.com/pricing |
| serpapi | install | REST API key at https://serpapi.com — GET /search | REST API key at https://serpapi.com — GET /search | FACT | https://serpapi.com |
| serpapi | health_url | https://serpapi.com | https://serpapi.com | FACT | https://serpapi.com |
| jina-reader | url | https://jina.ai/reader | https://jina.ai/reader | FACT | https://jina.ai/reader/ |
| jina-reader | price_band | freemium | freemium | FACT | https://jina.ai/reader/ |
| jina-reader | install | curl https://r.jina.ai/{url} — or Reader API with key at jina.ai | curl https://r.jina.ai/{url} — or Reader API with key at jina.ai | FACT | https://jina.ai/reader/ |
| jina-reader | health_url | https://r.jina.ai | https://r.jina.ai | FACT | https://r.jina.ai |
| browserless | url | https://www.browserless.io | https://www.browserless.io | FACT | https://www.browserless.io |
| browserless | price_band | freemium | freemium | FACT | https://www.browserless.io/pricing |
| browserless | install | REST/WebSocket — https://www.browserless.io/docs | REST/WebSocket — https://docs.browserless.io | FACT | https://www.browserless.io/docs |
| browserless | health_url | https://chrome.browserless.io | https://www.browserless.io | FACT | https://chrome.browserless.io |
| scrapingbee | url | https://www.scrapingbee.com | https://www.scrapingbee.com | FACT | https://www.scrapingbee.com |
| scrapingbee | price_band | freemium | unknown | UNVERIFIED | https://www.scrapingbee.com/pricing/ |
| scrapingbee | install | REST API — https://www.scrapingbee.com/documentation | REST API — https://www.scrapingbee.com/documentation | FACT | https://www.scrapingbee.com/documentation |
| scrapingbee | health_url | https://app.scrapingbee.com | https://app.scrapingbee.com | INFERENCE | https://app.scrapingbee.com |
| crawl4ai | url | https://github.com/unclecode/crawl4ai | https://github.com/unclecode/crawl4ai | FACT | https://github.com/unclecode/crawl4ai |
| crawl4ai | price_band | free | free | FACT | https://github.com/unclecode/crawl4ai |
| crawl4ai | install | pip install crawl4ai && crawl4ai-setup — self-host HTTP API | pip install -U crawl4ai && crawl4ai-setup | FACT | https://github.com/unclecode/crawl4ai |
| perplexity | url | https://docs.perplexity.ai | https://docs.perplexity.ai | FACT | https://docs.perplexity.ai |
| perplexity | price_band | paid | paid | FACT | https://docs.perplexity.ai/docs/getting-started/pricing |
| perplexity | install | OpenAI-compatible API — https://docs.perplexity.ai | OpenAI-compatible API — https://docs.perplexity.ai | FACT | https://docs.perplexity.ai |
| perplexity | health_url | https://api.perplexity.ai | https://api.perplexity.ai | INFERENCE | https://api.perplexity.ai |
| zapier-mcp | url | https://zapier.com/mcp | https://zapier.com/mcp | FACT | https://zapier.com/mcp |
| zapier-mcp | price_band | freemium | freemium | FACT | https://help.zapier.com/hc/en-us/articles/45645738385805-How-Zapier-MCP-usage-works |
| zapier-mcp | install | Configure at https://zapier.com/mcp — add remote MCP URL to client | Configure at https://zapier.com/mcp — add remote MCP URL to client | FACT | https://zapier.com/mcp |
| supabase-mcp | url | https://supabase.com/docs/guides/getting-started/mcp | https://supabase.com/docs/guides/ai-tools/mcp | FACT | https://supabase.com/docs/guides/getting-started/mcp |
| supabase-mcp | price_band | freemium | freemium | FACT | https://supabase.com/docs/guides/ai-tools/mcp |
| supabase-mcp | install | npx -y @supabase/mcp-server-supabase@latest | See https://supabase.com/docs/guides/ai-tools/mcp — remote https://mcp.supabase.com/mcp | FACT | https://supabase.com/docs/guides/ai-tools/mcp |
| linear-mcp | url | https://linear.app | https://linear.app/docs/mcp | FACT | https://linear.app/docs/mcp |
| linear-mcp | price_band | freemium | freemium | FACT | https://linear.app/docs/mcp |
| linear-mcp | install | Community/official Linear MCP — see Linear docs or Smithery for install | npx -y mcp-remote https://mcp.linear.app/mcp | FACT | https://linear.app/docs/mcp |
| stripe-api | url | https://stripe.com/docs/api | https://docs.stripe.com/api | FACT | https://stripe.com/docs/api |
| stripe-api | price_band | freemium | unknown | UNVERIFIED | https://docs.stripe.com/api |
| stripe-api | install | Official SDKs — https://stripe.com/docs/api; Stripe MCP community servers exist | Official SDKs — https://docs.stripe.com/api | FACT | https://docs.stripe.com/api |
| stripe-api | health_url | https://api.stripe.com | https://api.stripe.com | INFERENCE | https://api.stripe.com |
| openai-assistants | url | https://platform.openai.com/docs | https://developers.openai.com/api/docs | FACT | https://platform.openai.com/docs |
| openai-assistants | price_band | paid | paid | FACT | https://developers.openai.com/api/docs |
| openai-assistants | description | OpenAI platform APIs for chat, tools, file search, and assistants. Meta tooling for agents. | OpenAI platform APIs for chat, tools, file search, and the Responses API. Assistants API shut down 2026-08-26; use Responses + Conversations. | FACT | https://developers.openai.com/api/docs/assistants/migration |
| openai-assistants | install | openai Python/JS SDK — https://platform.openai.com/docs | openai Python/JS SDK — https://developers.openai.com/api/docs | FACT | https://developers.openai.com/api/docs |
| openai-assistants | health_url | https://api.openai.com | https://api.openai.com | INFERENCE | https://api.openai.com |
| anthropic-mcp | url | https://docs.anthropic.com/en/docs/agents-and-tools/mcp | https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector | FACT | https://docs.anthropic.com/en/docs/agents-and-tools/mcp |
| anthropic-mcp | price_band | paid | paid | FACT | https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector |
| anthropic-mcp | install | Configure MCP in Claude Desktop / API — see Anthropic MCP docs | See https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector — Messages API mcp_servers / Claude Desktop | FACT | https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector |
| playwright-mcp | url | https://github.com/microsoft/playwright-mcp | https://github.com/microsoft/playwright-mcp | FACT | https://github.com/microsoft/playwright-mcp |
| playwright-mcp | price_band | free | free | FACT | https://github.com/microsoft/playwright-mcp |
| playwright-mcp | install | npx -y @playwright/mcp@latest | npx -y @playwright/mcp@latest | FACT | https://github.com/microsoft/playwright-mcp |
| duckduckgo-search | url | https://github.com/nickclyde/duckduckgo-mcp-server | https://github.com/nickclyde/duckduckgo-mcp-server | FACT | https://github.com/nickclyde/duckduckgo-mcp-server |
| duckduckgo-search | price_band | free | free | FACT | https://github.com/nickclyde/duckduckgo-mcp-server |
| duckduckgo-search | install | npx -y duckduckgo-mcp-server | uvx duckduckgo-mcp-server | FACT | https://github.com/nickclyde/duckduckgo-mcp-server |
| _catalog | updated_at | 2026-09-12T00:00:00.000Z | 2026-09-12T00:00:00.000Z | FACT |  |

## Per-tool notes

| id | notes |
|---|---|
| firecrawl | URL 200. Freemium (1,000 credits/mo). `npx -y firecrawl-mcp` official. `api.firecrawl.dev` 200. Hosted MCP also at `https://mcp.firecrawl.dev/v2/mcp`. |
| exa | URL 200. Freemium (monthly free credits + PAYG). `npx -y exa-mcp-server` official; hosted `https://mcp.exa.ai/mcp`. `api.exa.ai` 404 on `/`. |
| tavily | `tavily.com` → `www.tavily.com`. Freemium 1,000 credits/mo. `npx -y tavily-mcp` official; remote `https://mcp.tavily.com/mcp/`. |
| browserbase | URL 200. Free plan + paid. `@browserbasehq/mcp` on npm 3.0.0. |
| apify | URL 200. Free plan with $5 credits. `@apify/actors-mcp-server` on npm. `api.apify.com` 404 on `/`. |
| composio | URL 200. Hobby $0 (100K tool calls). `@composio/mcp` on npm. `backend.composio.dev` 200. |
| context7 | URL 200. Plans page shows Free + Pro → **freemium**. `@upstash/context7-mcp` on npm. |
| brightdata | URL 200. Official MCP docs: 5,000 free requests/mo → **freemium**. `@brightdata/mcp` on npm. `api.brightdata.com` 404 on `/`. |
| parallel | URL 200. Pricing page 200 (free monthly + PAYG). Install docs URL was 404; now `docs.parallel.ai`. |
| smithery | URL 200. Pricing page 200. `@smithery/cli` on npm 4.11.1. |
| glama | URL 200. Pricing URL redirected to signup; band kept freemium as INFERENCE. |
| mcp-registry | URL 200. Free public registry. `/v0/servers` 200. |
| brave-search | API page 200. Official MCP is `@brave/brave-search-mcp-server`; MCP reference server archived. |
| puppeteer-mcp | Archived reference. npm package still exists. Prefer Playwright MCP. ID kept. |
| fetch-mcp | Still official (Python). Install `uvx mcp-server-fetch`. npm name 404. |
| github-mcp | Official is GitHub-hosted remote or `ghcr.io/github/github-mcp-server`. Old npx is archived. |
| filesystem-mcp | Still official reference. npx package 2026.8.31. |
| memory-mcp | Still official reference. npx package 2026.8.31. |
| sqlite-mcp | Archived. npm 404. PyPI `mcp-server-sqlite` + `uvx` still real. |
| postgres-mcp | Archived official reference. Pointed at crystaldba/postgres-mcp docs rather than a stale npx. |
| slack-mcp | Official hosted MCP at `https://mcp.slack.com/mcp`. Old npx archived. |
| notion-api | Official hosted MCP `https://mcp.notion.com/mcp`. Interface set to `both`. `api.notion.com` redirects to notion.so. |
| serpapi | URL + pricing 200. Forever-free 250 searches/mo. |
| jina-reader | URL 200. `r.jina.ai` 200. Keyless + keyed/paid. |
| browserless | Free plan on official pricing. Docs redirect to `docs.browserless.io`. Old health host 502. |
| scrapingbee | Site 200. Price band **unknown** (trial vs free tier unclear). `app.scrapingbee.com` → login. |
| crawl4ai | Repo 200. OSS free. Install matches official `pip install -U crawl4ai && crawl4ai-setup`. |
| perplexity | Docs 200. API is paid PAYG. `api.perplexity.ai` 404 on `/`. |
| zapier-mcp | URL 200. MCP included on Zapier plans including Free; tasks consumed. |
| supabase-mcp | Docs moved to `/docs/guides/ai-tools/mcp`. Official remote `https://mcp.supabase.com/mcp`. |
| linear-mcp | Official docs `/docs/mcp`. Remote `https://mcp.linear.app/mcp` via `mcp-remote`. |
| stripe-api | Docs canonicalized to `docs.stripe.com/api`. Price band **unknown**. `api.stripe.com` 404 on `/`. |
| openai-assistants | Docs moved to developers.openai.com. Assistants API sunset 2026-08-26; ID kept. `api.openai.com` 421. |
| anthropic-mcp | Old URL redirected to MCP spec site. Now MCP connector docs. Claude API is paid. |
| playwright-mcp | Repo 200. `npx -y @playwright/mcp@latest` official. npm 0.0.80. |
| duckduckgo-search | Repo 200. Official `uvx duckduckgo-mcp-server`. npm name is a different project. |

## Removed tools

None. All 36 IDs remain. Archived MCP reference servers still exist as products/docs and were retargeted, not deleted.

