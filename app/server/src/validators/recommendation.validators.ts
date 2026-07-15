import { z } from "zod";

export const listRecommendationsQuerySchema = z.object({
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  includeResolved: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListRecommendationsQuery = z.infer<typeof listRecommendationsQuerySchema>;

export const recommendationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
