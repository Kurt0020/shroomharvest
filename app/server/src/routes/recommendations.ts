import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  listRecommendationsQuerySchema,
  recommendationIdParamSchema,
  type ListRecommendationsQuery,
} from "../validators/recommendation.validators.js";
import {
  listRecommendations,
  reconcileRecommendations,
  resolveRecommendation,
} from "../services/recommendationService.js";

export const recommendationsRouter = Router();

recommendationsRouter.get(
  "/",
  validate(listRecommendationsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListRecommendationsQuery;
    const data = await listRecommendations(req.shopId as number, query);
    res.json({ data });
  })
);

/**
 * No background job scheduler exists yet, so the engine runs on demand —
 * either the dashboard triggers it, or a merchant clicks "Refresh
 * recommendations." A real deployment would run this on a cron/webhook
 * (e.g. after each order/inventory change) instead of relying on a request.
 */
recommendationsRouter.post(
  "/generate",
  asyncHandler(async (req, res) => {
    const result = await reconcileRecommendations(req.shopId as number);
    res.json({ data: result });
  })
);

recommendationsRouter.post(
  "/:id/resolve",
  validate(recommendationIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    await resolveRecommendation(req.shopId as number, id);
    res.status(204).send();
  })
);
