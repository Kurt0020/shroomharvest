import { Router } from "express";

export const meRouter = Router();

/**
 * Protected by verifyRequest (mounted under /api). Existing purely to prove
 * the whole chain works: App Bridge session token -> decodeSessionToken ->
 * offline session lookup -> access to req.shopDomain here.
 */
meRouter.get("/", (req, res) => {
  res.status(200).json({
    shop: req.shopDomain,
    authenticated: true,
  });
});
