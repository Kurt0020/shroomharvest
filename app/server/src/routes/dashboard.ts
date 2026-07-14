import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getDashboardSummary } from "../services/dashboardService.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await getDashboardSummary(req.shopId as number);
    res.json({ data: summary });
  })
);
