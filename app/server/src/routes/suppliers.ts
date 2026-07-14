import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  supplierIdParamSchema,
  type ListSuppliersQuery,
} from "../validators/supplier.validators.js";
import { createSupplier, getSupplierById, listSuppliers } from "../services/supplierService.js";

export const suppliersRouter = Router();

suppliersRouter.get(
  "/",
  validate(listSuppliersQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListSuppliersQuery;
    const result = await listSuppliers(req.shopId as number, query);
    res.json(result);
  })
);

suppliersRouter.get(
  "/:id",
  validate(supplierIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const supplier = await getSupplierById(req.shopId as number, id);
    res.json({ data: supplier });
  })
);

suppliersRouter.post(
  "/",
  validate(createSupplierSchema, "body"),
  asyncHandler(async (req, res) => {
    const supplier = await createSupplier(req.shopId as number, req.body);
    res.status(201).json({ data: supplier });
  })
);
