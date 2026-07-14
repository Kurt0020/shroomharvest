import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { listActivityQuerySchema, type ListActivityQuery } from "../validators/activity.validators.js";
import { listActivity } from "../services/activityLogService.js";

export const activityRouter = Router();

activityRouter.get(
  "/",
  validate(listActivityQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListActivityQuery;
    const result = await listActivity(req.shopId as number, query);
    res.json(result);
  })
);
