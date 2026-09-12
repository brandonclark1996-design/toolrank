import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CatalogSchema } from '../src/types.js';
import { rankTools, tokenize } from '../src/ranking.js';

const catalog = CatalogSchema.parse(
  JSON.parse(readFileSync(join(process.cwd(), 'data/catalog.json'), 'utf8')),
);

describe('tokenize', () => {
  it('drops stopwords and lowercases', () => {
    expect(tokenize('Scrape a website to markdown for RAG')).toEqual(
      expect.arrayContaining(['scrape', 'website', 'markdown', 'rag']),
    );
    expect(tokenize('Scrape a website to markdown for RAG')).not.toContain('to');
    expect(tokenize('Scrape a website to markdown for RAG')).not.toContain('for');
  });
});

describe('rankTools — fixture jobs', () => {
  it('ranks scrape/markdown/RAG tools highly for scrape job', () => {
    const results = rankTools(catalog.tools, {
      job: 'scrape website to markdown for RAG',
      limit: 10,
      check_health: false,
    });
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((r) => r.id);
    // At least one of the obvious scrape/markdown tools should be in top 5
    const expected = ['firecrawl', 'jina-reader', 'fetch-mcp', 'crawl4ai', 'apify'];
    const top5 = ids.slice(0, 5);
    expect(top5.some((id) => expected.includes(id))).toBe(true);
    // Scores should be descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('ranks web search tools for research job and respects free budget', () => {
    const results = rankTools(catalog.tools, {
      job: 'search the web for research papers and news',
      constraints: { budget: 'free' },
      limit: 10,
      check_health: false,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(['free', 'freemium']).toContain(r.price_band);
    }
    const ids = results.map((r) => r.id);
    const searchy = ['exa', 'tavily', 'brave-search', 'duckduckgo-search', 'serpapi', 'parallel'];
    expect(ids.slice(0, 6).some((id) => searchy.includes(id))).toBe(true);
  });
});
