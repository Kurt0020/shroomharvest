import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  inventoryIdParamSchema,
  listInventoryQuerySchema,
  type ListInventoryQuery,
} from "../validators/inventory.validators.js";
import { getInventoryById, listInventory } from "../services/inventoryService.js";

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
