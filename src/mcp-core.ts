/**
 * Shared MCP tool definitions + handlers.
 * Used by stdio (src/mcp.ts) and Streamable HTTP /mcp (src/mcp-http.ts).
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getToolById, listFresh, loadCatalog } from './catalog.js';
import { rankTools } from './ranking.js';
import { responseEnvelope } from './schema.js';
import { SearchBodySchema } from './types.js';

export const MCP_SERVER_INFO = { name: 'toolrank', version: '0.1.0' } as const;

export const MCP_TOOLS = [
  {
    name: 'search_tools',
    description:
      'Rank MCP servers/APIs for a job. Returns shortlist with health, price_band, install snippet.',
    inputSchema: {
      type: 'object',
      properties: {
        job: { type: 'string', description: 'What the agent needs to do' },
        budget: { type: 'string', enum: ['free', 'paid', 'any'] },
        auth: { type: 'string' },
        runtime: { type: 'string', description: 'e.g. mcp, api' },
        limit: { type: 'number' },
      },
      required: ['job'],
    },
  },
  {
    name: 'get_tool',
    description: 'Get a single catalog tool by id',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'list_fresh',
    description: 'List tools updated after an ISO timestamp (optional)',
    inputSchema: {
      type: 'object',
      properties: { since: { type: 'string', description: 'ISO date-time' } },
    },
  },
] as const;

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

export async function callMcpTool(
  name: string,
  args: Record<string, unknown> | undefined,
): Promise<ToolResult> {
  const a = args ?? {};

  try {
    if (name === 'search_tools') {
      const parsed = SearchBodySchema.parse({
        job: a.job,
        constraints: {
          budget: a.budget,
          auth: a.auth,
          runtime: a.runtime,
        },
        limit: a.limit ?? 10,
      });
      if (parsed.constraints) {
        const c = parsed.constraints;
        if (c.budget === undefined && c.auth === undefined && c.runtime === undefined) {
          parsed.constraints = undefined;
        }
      }
      const results = rankTools(loadCatalog().tools, parsed);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseEnvelope({ count: results.length, results }), null, 2),
          },
        ],
      };
    }

    if (name === 'get_tool') {
      const id = String(a.id ?? '');
      const tool = getToolById(id);
      if (!tool) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'not found', id }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(responseEnvelope({ tool }), null, 2) }],
      };
    }

    if (name === 'list_fresh') {
      const since = a.since ? String(a.since) : undefined;
      const tools = listFresh(since);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              responseEnvelope({ since: since ?? null, count: tools.length, tools }),
              null,
              2,
            ),
          },
        ],
      };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { content: [{ type: 'text', text: msg }], isError: true };
  }
}

/** Fresh Server per connection/request so stdio and HTTP stay in sync. */
export function createMcpServer(): Server {
  const server = new Server(MCP_SERVER_INFO, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MCP_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return callMcpTool(name, (args ?? {}) as Record<string, unknown>);
  });

  return server;
}
