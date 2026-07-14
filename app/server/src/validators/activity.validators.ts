import { z } from "zod";

export const ACTIVITY_ENTITY_TYPES = ["product", "inventory", "supplier", "recommendation"] as const;

export const ACTIVITY_ACTIONS = [
  "product_created",
  "product_updated",
  "inventory_updated",
  "inventory_archived",
  "inventory_unarchived",
  "threshold_changed",
  "supplier_created",
  "supplier_updated",
  "recommendation_generated",
  "recommendation_resolved",
] as const;

export const listActivityQuerySchema = z.object({
  entityType: z.enum(ACTIVITY_ENTITY_TYPES).optional(),
  action: z.enum(ACTIVITY_ACTIONS).optional(),
  // Free-text search over the human-readable description, e.g. "Chaga".
  search: z.string().trim().min(1).max(255).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;
