import type { BudgetConstraint, RankedTool, SearchBody, Tool } from './types.js';

const STOP = new Set([
  'a', 'an', 'the', 'to', 'for', 'of', 'and', 'or', 'in', 'on', 'with', 'from',
  'into', 'via', 'by', 'is', 'are', 'be', 'as', 'at', 'it', 'this', 'that',
  'my', 'our', 'your', 'me', 'we', 'you', 'i', 'how', 'what', 'get', 'use',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-/\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

function budgetAllows(tool: Tool, budget?: BudgetConstraint): boolean {
  if (!budget || budget === 'any') return true;
  if (budget === 'free') {
    return tool.price_band === 'free' || tool.price_band === 'freemium';
  }
  // paid: exclude free-only
  return tool.price_band === 'paid' || tool.price_band === 'freemium' || tool.price_band === 'unknown';
}

function matchesAuth(tool: Tool, auth?: string): boolean {
  if (!auth) return true;
  const a = auth.toLowerCase();
  const blob = `${tool.description} ${tool.tags.join(' ')} ${tool.install}`.toLowerCase();
  if (a === 'none' || a === 'no-auth' || a === 'anonymous') {
    return tool.price_band === 'free' || blob.includes('no api key') || blob.includes('no key');
  }
  return blob.includes(a) || tool.tags.some((t) => t.toLowerCase().includes(a));
}

function matchesRuntime(tool: Tool, runtime?: string): boolean {
  if (!runtime) return true;
  const r = runtime.toLowerCase();
  const blob = `${tool.install} ${tool.description} ${tool.interface}`.toLowerCase();
  if (r === 'mcp') return tool.interface === 'mcp' || tool.interface === 'both';
  if (r === 'api' || r === 'http' || r === 'rest') {
    return tool.interface === 'api' || tool.interface === 'both';
  }
  return blob.includes(r);
}

export function scoreTool(tool: Tool, tokens: string[], budget?: BudgetConstraint): RankedTool {
  const reasons: string[] = [];
  let score = 0;

  const nameL = tool.name.toLowerCase();
  const descL = tool.description.toLowerCase();
  const tagsL = tool.tags.map((t) => t.toLowerCase());
  const idL = tool.id.toLowerCase();

  for (const tok of tokens) {
    if (tagsL.includes(tok)) {
      score += 4;
      reasons.push(`tag:${tok}`);
    } else if (tagsL.some((t) => t.includes(tok) || tok.includes(t))) {
      score += 2;
      reasons.push(`tag~${tok}`);
    }

    if (nameL === tok || idL === tok) {
      score += 5;
      reasons.push(`name:${tok}`);
    } else if (nameL.includes(tok) || idL.includes(tok)) {
      score += 3;
      reasons.push(`name~${tok}`);
    }

    if (descL.includes(tok)) {
      score += 1;
      reasons.push(`desc:${tok}`);
    }
  }

  // Price band boost when constraint matches
  if (budget === 'free' && (tool.price_band === 'free' || tool.price_band === 'freemium')) {
    score += 2;
    reasons.push('budget:free-ok');
  }
  if (budget === 'paid' && tool.price_band === 'paid') {
    score += 1;
    reasons.push('budget:paid');
  }
  if (tool.price_band === 'free') {
    score += 0.5;
    reasons.push('price:free');
  }

  // Health boost for known-up
  if (tool.health === 'up') {
    score += 2;
    reasons.push('health:up');
  } else if (tool.health === 'down') {
    score -= 3;
    reasons.push('health:down');
  }

  // Prefer mcp|both slightly for agent jobs (honest small nudge)
  if (tool.interface === 'mcp' || tool.interface === 'both') {
    score += 0.25;
  }

  const uniqReasons = [...new Set(reasons)].slice(0, 12);
  return { ...tool, score, reasons: uniqReasons };
}

export function rankTools(tools: Tool[], body: SearchBody): RankedTool[] {
  const tokens = tokenize(body.job);
  const budget = body.constraints?.budget;
  const auth = body.constraints?.auth;
  const runtime = body.constraints?.runtime;
  const limit = body.limit ?? 10;

  const filtered = tools.filter(
    (t) => budgetAllows(t, budget) && matchesAuth(t, auth) && matchesRuntime(t, runtime),
  );

  const ranked = filtered
    .map((t) => scoreTool(t, tokens, budget))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  // If nothing matched tokens, return a soft fallback: all filtered by budget, low score by name
  if (ranked.length === 0) {
    return filtered
      .map((t) => ({
        ...t,
        score: t.health === 'up' ? 0.5 : 0.1,
        reasons: ['fallback:no-token-match'],
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  return ranked.slice(0, limit);
}
