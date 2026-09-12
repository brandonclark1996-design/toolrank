/** Wire format version for HTTP + MCP JSON envelopes. Bump on breaking response shape changes. */
export const SCHEMA_VERSION = '0.1.0';

export function responseEnvelope<T extends Record<string, unknown>>(payload: T) {
  return {
    schema_version: SCHEMA_VERSION,
    as_of: new Date().toISOString(),
    ...payload,
  };
}
