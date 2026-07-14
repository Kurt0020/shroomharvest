import { z } from "zod";

export const INVENTORY_STATUSES = ["in_stock", "low_stock", "out_of_stock", "archived"] as const;

export const listInventoryQuerySchema = z.object({
  status: z.enum(INVENTORY_STATUSES).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>;

export const inventoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
