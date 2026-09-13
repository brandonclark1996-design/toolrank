export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'ToolRank API',
    version: '0.1.0',
    description:
      'Ranked shortlist of MCP servers/APIs for agent jobs. Lexical ranking over 36 curated tools; health is often unknown. Optional API keys via Authorization: Bearer or X-API-Key (TOOLRANK_API_KEYS). Anonymous: 20/IP/24h on /v1/* and /mcp. free key: 100/24h; builder: 2000/24h (process-local). /health and /openapi.json are open. Streamable HTTP MCP at POST /mcp. Successful JSON bodies include schema_version and as_of. Stripe/custom domain not wired.',
  },
  servers: [
    { url: 'https://toolrank.onrender.com', description: 'Production (Render)' },
    { url: 'http://localhost:8787', description: 'Local default' },
    { url: '/', description: 'Same origin / deployed host' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key from TOOLRANK_API_KEYS',
      },
      apiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Liveness',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    catalog: {
                      type: 'object',
                      properties: {
                        version: { type: 'number' },
                        updated_at: { type: 'string' },
                        count: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/search': {
      post: {
        summary: 'Rank tools for a job',
        security: [{ bearerAuth: [] }, { apiKeyHeader: [] }, {}],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['job'],
                properties: {
                  job: { type: 'string', example: 'scrape website to markdown for RAG' },
                  constraints: {
                    type: 'object',
                    properties: {
                      budget: { type: 'string', enum: ['free', 'paid', 'any'] },
                      auth: { type: 'string' },
                      runtime: { type: 'string', description: 'e.g. mcp, api, node' },
                    },
                  },
                  limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
                  check_health: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Ranked shortlist (schema_version + as_of + results; plan when authed)' },
          '400': { description: 'Validation error' },
          '401': { description: 'Invalid API key' },
          '429': { description: 'Quota exceeded (Retry-After)' },
        },
      },
    },
    '/v1/tools/{id}': {
      get: {
        summary: 'Get tool by id',
        security: [{ bearerAuth: [] }, { apiKeyHeader: [] }, {}],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Tool' },
          '401': { description: 'Invalid API key' },
          '404': { description: 'Not found' },
          '429': { description: 'Quota exceeded' },
        },
      },
    },
    '/v1/fresh': {
      get: {
        summary: 'Tools updated since a timestamp',
        security: [{ bearerAuth: [] }, { apiKeyHeader: [] }, {}],
        parameters: [
          {
            name: 'since',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': { description: 'Fresh tools' },
          '400': { description: 'Invalid since' },
          '401': { description: 'Invalid API key' },
          '429': { description: 'Quota exceeded' },
        },
      },
    },
    '/openapi.json': {
      get: {
        summary: 'OpenAPI document',
        security: [],
        responses: { '200': { description: 'OpenAPI 3.1 JSON' } },
      },
    },
  },
} as const;
