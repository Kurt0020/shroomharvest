import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db/client.js";
import { shops } from "../db/schema.js";
import { UnauthorizedError } from "../lib/errors.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      shopId?: number;
    }
  }
}

/**
 * Runs after verifyRequest. verifyRequest proves *who* is calling (a valid
 * session for shopDomain); this resolves *which row* that maps to so every
 * business route can scope its queries with `eq(table.shopId, req.shopId)`
 * instead of trusting a client-supplied id. This is what makes the
 * multi-tenant design in the schema actually enforced, not just possible.
 */
export async function attachShop(req: Request, _res: Response, next: NextFunction) {
  if (!req.shopDomain) {
    next(new UnauthorizedError("No verified shop on this request."));
    return;
  }

  const [shop] = await db
    .select({ id: shops.id, isActive: shops.isActive })
    .from(shops)
    .where(eq(shops.shopifyDomain, req.shopDomain))
    .limit(1);

  if (!shop || !shop.isActive) {
    next(new UnauthorizedError("Shop is not installed or has been uninstalled."));
    return;
  }

  req.shopId = shop.id;
  next();
}
