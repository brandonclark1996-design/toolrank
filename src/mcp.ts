/**
 * MCP stdio server for ToolRank.
 * Tools: search_tools, get_tool, list_fresh (shared with HTTP /mcp via mcp-core).
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadCatalog } from './catalog.js';
import { createMcpServer } from './mcp-core.js';

loadCatalog();

async function main() {
  const transport = new StdioServerTransport();
  const server = createMcpServer();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('ToolRank MCP failed:', err);
  process.exit(1);
});
