import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  contactEmail: z.string().email().max(255).optional(),
  contactPhone: z.string().trim().max(64).optional(),
  leadTimeDays: z.coerce.number().int().positive().default(7),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const listSuppliersQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;

export const supplierIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
