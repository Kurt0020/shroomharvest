import { eq } from "drizzle-orm";
import { Session } from "@shopify/shopify-api";
import { db } from "../db/client.js";
import { sessions, shops } from "../db/schema.js";

/**
 * A minimal session storage backed by the `sessions` table. The
 * @shopify/shopify-api package doesn't ship a storage implementation out of
 * the box (that's what the separate @shopify/shopify-app-session-storage-*
 * packages are for) — since we're already on Drizzle + MySQL, it's simpler
 * and more consistent to implement the handful of methods we need directly
 * against our own schema rather than pull in another storage adapter.
 */
class DrizzleSessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    const data = session.toObject();

    // Look up the shop row so we can keep sessions.shop_id in sync. The shop
    // row itself is created/updated by shopService.upsertShopFromSession
    // right after OAuth completes, so this is usually already present.
    const [shopRow] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(eq(shops.shopifyDomain, data.shop))
      .limit(1);

    const values = {
      id: data.id,
      shopId: shopRow?.id ?? null,
      shop: data.shop,
      state: data.state ?? "",
      isOnline: data.isOnline,
      scope: data.scope ?? null,
      accessToken: data.accessToken ?? null,
      expires: data.expires ?? null,
      onlineAccessInfo: data.onlineAccessInfo ?? null,
    };

    const existing = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.id, data.id))
      .limit(1);

    if (existing.length > 0) {
      await db.update(sessions).set(values).where(eq(sessions.id, data.id));
    } else {
      await db.insert(sessions).values(values);
    }

    return true;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    if (!row) return undefined;

    return new Session({
      id: row.id,
      shop: row.shop,
      state: row.state,
      isOnline: row.isOnline,
      scope: row.scope ?? undefined,
      accessToken: row.accessToken ?? undefined,
      expires: row.expires ?? undefined,
      onlineAccessInfo: (row.onlineAccessInfo as Session["onlineAccessInfo"]) ?? undefined,
    });
  }

  async deleteSession(id: string): Promise<boolean> {
    await db.delete(sessions).where(eq(sessions.id, id));
    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      await this.deleteSession(id);
    }
    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const rows = await db.select().from(sessions).where(eq(sessions.shop, shop));
    return rows.map(
      (row) =>
        new Session({
          id: row.id,
          shop: row.shop,
          state: row.state,
          isOnline: row.isOnline,
          scope: row.scope ?? undefined,
          accessToken: row.accessToken ?? undefined,
          expires: row.expires ?? undefined,
          onlineAccessInfo: (row.onlineAccessInfo as Session["onlineAccessInfo"]) ?? undefined,
        })
    );
  }
}

export const sessionStorage = new DrizzleSessionStorage();
