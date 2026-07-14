import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  "fresh_mushrooms",
  "dried_mushrooms",
  "mushroom_coffee",
  "mushroom_tea",
  "mushroom_powders",
  "mushroom_supplements",
  "grow_kits",
  "gift_boxes",
] as const;

export const createProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(255),
  sku: z.string().trim().max(128).optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  unitCost: z.coerce.number().nonnegative().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  imageUrl: z.string().url().max(1024).optional(),
  // Initial inventory is created alongside the product — this is the
  // "business logic" piece: a product without a stock record is a bug
  // waiting to happen for the dashboard/recommendation modules, so we
  // require it up front rather than allowing an orphaned product row.
  initialQuantity: z.coerce.number().int().nonnegative().default(0),
  supplierId: z.coerce.number().int().positive().optional(),
  reorderPoint: z.coerce.number().int().nonnegative().default(10),
  reorderQuantity: z.coerce.number().int().positive().default(20),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(10),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const listProductsQuerySchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
