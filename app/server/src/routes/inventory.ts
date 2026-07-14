import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  adjustStockSchema,
  inventoryIdParamSchema,
  listInventoryQuerySchema,
  updateInventorySchema,
  type AdjustStockInput,
  type ListInventoryQuery,
  type UpdateInventoryInput,
} from "../validators/inventory.validators.js";
import {
  adjustStock,
  archiveInventory,
  getInventoryById,
  listInventory,
  unarchiveInventory,
  updateInventoryThresholds,
} from "../services/inventoryService.js";

export const inventoryRouter = Router();

inventoryRouter.get(
  "/",
  validate(listInventoryQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListInventoryQuery;
    const result = await listInventory(req.shopId as number, query);
    res.json(result);
  })
);

inventoryRouter.get(
  "/:id",
  validate(inventoryIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const row = await getInventoryById(req.shopId as number, id);
    res.json({ data: row });
  })
);

// Threshold / supplier assignment updates — not a stock quantity change.
inventoryRouter.patch(
  "/:id",
  validate(inventoryIdParamSchema, "params"),
  validate(updateInventorySchema, "body"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const body = req.body as UpdateInventoryInput;
    const row = await updateInventoryThresholds(req.shopId as number, id, body);
    res.json({ data: row });
  })
);

// Stock quantity changes — always goes through inventory_history, never a
// direct PATCH to quantityOnHand, so every change has an audit trail.
inventoryRouter.post(
  "/:id/adjust",
  validate(inventoryIdParamSchema, "params"),
  validate(adjustStockSchema, "body"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const body = req.body as AdjustStockInput;
    const row = await adjustStock(req.shopId as number, id, body);
    res.json({ data: row });
  })
);

inventoryRouter.post(
  "/:id/archive",
  validate(inventoryIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const row = await archiveInventory(req.shopId as number, id);
    res.json({ data: row });
  })
);

inventoryRouter.post(
  "/:id/unarchive",
  validate(inventoryIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const row = await unarchiveInventory(req.shopId as number, id);
    res.json({ data: row });
  })
);
