import type { Health, RankedTool, Tool } from './types.js';

const TIMEOUT_MS = 2000;

export async function probeHealth(tool: Tool): Promise<Health> {
  const url = tool.health_url ?? tool.url;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'ToolRank/0.1-health' },
    });
    // Any HTTP response (even 401/403/404) means the host is reachable → up
    if (res.status > 0) return 'up';
    return 'unknown';
  } catch {
    return 'unknown'; // flaky or blocked — stay honest, don't mark down
  } finally {
    clearTimeout(timer);
  }
}

/** Probe top N results in parallel; never throws; skips marking down on failure. */
export async function enrichHealth(
  tools: RankedTool[],
  topN = 3,
): Promise<RankedTool[]> {
  const slice = tools.slice(0, topN);
  const rest = tools.slice(topN);
  const probed = await Promise.all(
    slice.map(async (t) => {
      const health = await probeHealth(t);
      const next = { ...t, health };
      if (health === 'up') {
        next.score = t.score + 2;
        if (!next.reasons.includes('health:up')) next.reasons = [...next.reasons, 'health:up'];
      }
      return next;
    }),
  );
  return [...probed, ...rest].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
