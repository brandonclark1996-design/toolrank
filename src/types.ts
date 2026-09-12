import { z } from 'zod';

export const PriceBandSchema = z.enum(['free', 'freemium', 'paid', 'unknown']);
export type PriceBand = z.infer<typeof PriceBandSchema>;

export const InterfaceSchema = z.enum(['mcp', 'api', 'both']);
export type ToolInterface = z.infer<typeof InterfaceSchema>;

export const HealthSchema = z.enum(['up', 'down', 'unknown']);
export type Health = z.infer<typeof HealthSchema>;

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  interface: InterfaceSchema,
  price_band: PriceBandSchema,
  tags: z.array(z.string()),
  description: z.string(),
  install: z.string(),
  health: HealthSchema.default('unknown'),
  health_url: z.string().url().optional(),
  updated_at: z.string(),
});
export type Tool = z.infer<typeof ToolSchema>;

export const CatalogSchema = z.object({
  version: z.number(),
  updated_at: z.string(),
  tools: z.array(ToolSchema),
});
export type Catalog = z.infer<typeof CatalogSchema>;

export const BudgetConstraintSchema = z.enum(['free', 'paid', 'any']);
export type BudgetConstraint = z.infer<typeof BudgetConstraintSchema>;

export const SearchConstraintsSchema = z
  .object({
    budget: BudgetConstraintSchema.optional(),
    auth: z.string().optional(),
    runtime: z.string().optional(),
  })
  .optional();

export const SearchBodySchema = z.object({
  job: z.string().min(1),
  constraints: SearchConstraintsSchema,
  limit: z.number().int().min(1).max(50).optional().default(10),
  check_health: z.boolean().optional().default(false),
});
export type SearchBody = z.infer<typeof SearchBodySchema>;

export type RankedTool = Tool & {
  score: number;
  reasons: string[];
};
