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

export const updateInventorySchema = z
  .object({
    supplierId: z.coerce.number().int().positive().nullable().optional(),
    reorderPoint: z.coerce.number().int().nonnegative().optional(),
    reorderQuantity: z.coerce.number().int().positive().optional(),
    lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
    safetyStock: z.coerce.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

export const adjustStockSchema = z.object({
  // Positive = stock coming in (restock), negative = stock going out (sale,
  // spoilage, correction). Zero is rejected — it isn't a real adjustment.
  delta: z.coerce
    .number()
    .int()
    .refine((v) => v !== 0, "Delta cannot be zero."),
  changeType: z.enum(["restock", "sale", "manual_adjustment"]).optional(),
  note: z.string().trim().max(1000).optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
