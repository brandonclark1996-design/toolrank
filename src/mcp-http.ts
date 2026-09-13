/**
 * Streamable HTTP MCP for Hono (Web Standard Request/Response).
 *
 * Official Hono pattern uses WebStandardStreamableHTTPServerTransport + c.req.raw.
 * StreamableHTTPServerTransport is the Node IncomingMessage/ServerResponse wrapper
 * around the same transport — not usable from Hono's fetch-style app.request().
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './mcp-core.js';

export async function handleMcpHttp(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    // Stateless: new transport+server per HTTP request (Render / no sticky sessions).
    sessionIdGenerator: undefined,
    // JSON responses (no long-lived SSE). Clients must still Accept both types.
    enableJsonResponse: true,
  });
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}
