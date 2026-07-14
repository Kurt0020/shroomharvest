import { eq } from "drizzle-orm";
import type { Session } from "@shopify/shopify-api";
import { db } from "../db/client.js";
import { shops } from "../db/schema.js";

/**
 * Called right after OAuth callback succeeds. Creates the shop row on first
 * install, or reactivates it if this is a merchant reinstalling after
 * having previously uninstalled.
 */
export async function upsertShopFromSession(session: Session) {
  const [existing] = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.shopifyDomain, session.shop))
    .limit(1);

  if (existing) {
    await db
      .update(shops)
      .set({ isActive: true, uninstalledAt: null })
      .where(eq(shops.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(shops)
    .values({
      shopifyDomain: session.shop,
      // Real shop name, email, and plan get filled in once Module 3 wires
      // up Admin API calls. Using the domain as a placeholder keeps the
      // NOT NULL constraint satisfied without a speculative API call here.
      shopName: session.shop.replace(".myshopify.com", ""),
      isActive: true,
    })
    .$returningId();

  return inserted.id;
}

/** Marks a shop inactive when the `app/uninstalled` webhook fires (Module 3). */
export async function markShopUninstalled(shopDomain: string) {
  await db
    .update(shops)
    .set({ isActive: false, uninstalledAt: new Date() })
    .where(eq(shops.shopifyDomain, shopDomain));
}
