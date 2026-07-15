import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { inventory, products, recommendations, suppliers } from "../db/schema.js";
import {
  averageHealthScore,
  computeItemHealthScore,
  generateRecommendationCandidates,
  type RecommendationCandidate,
} from "../lib/recommendationEngine.js";
import { logActivity } from "./activityLogService.js";
import type { ListRecommendationsQuery } from "../validators/recommendation.validators.js";

interface ScoredItem {
  inventoryId: number;
  productId: number;
  healthScore: number;
  candidates: RecommendationCandidate[];
}

/**
 * Runs the engine against every active (non-archived) inventory item for a
 * shop and returns per-item health scores + candidate recommendations.
 * Pure read — doesn't touch the `recommendations` table. Used both by
 * `reconcileRecommendations` below and by the dashboard, which only needs
 * the scores, not the DB writes.
 */
export async function scoreShopInventory(shopId: number): Promise<ScoredItem[]> {
  const rows = await db
    .select({
      inventory,
      product: products,
      supplier: suppliers,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
    .where(and(eq(inventory.shopId, shopId), eq(products.isActive, true)));

  return rows
    .filter((row) => row.inventory.status !== "archived")
    .map((row) => {
      const avgDailySales = Number(row.inventory.avgDailySales ?? 0);
      const leadTimeDays = row.supplier?.leadTimeDays ?? null;

      const healthScore = computeItemHealthScore({
        quantityOnHand: row.inventory.quantityOnHand,
        avgDailySales,
        safetyStock: row.inventory.safetyStock,
        leadTimeDays,
      });

      const candidates = generateRecommendationCandidates({
        quantityOnHand: row.inventory.quantityOnHand,
        avgDailySales,
        safetyStock: row.inventory.safetyStock,
        leadTimeDays,
        productTitle: row.product.title,
        supplierName: row.supplier?.name ?? null,
        reorderQuantity: row.inventory.reorderQuantity,
      });

      return { inventoryId: row.inventory.id, productId: row.product.id, healthScore, candidates };
    });
}

export async function getShopHealthScore(shopId: number): Promise<number> {
  const scored = await scoreShopInventory(shopId);
  return averageHealthScore(scored.map((item) => item.healthScore));
}

/**
 * The actual "engine run": for every item, whatever candidates currently
 * apply get created if they don't already have an unresolved recommendation
 * of that type; whatever no longer applies gets marked resolved. This is
 * idempotent — running it twice in a row with no data changes produces no
 * new rows and resolves nothing, since everything already matches.
 */
export async function reconcileRecommendations(shopId: number) {
  const scored = await scoreShopInventory(shopId);

  const existing = await db
    .select()
    .from(recommendations)
    .where(and(eq(recommendations.shopId, shopId), eq(recommendations.isResolved, false)));

  const existingByProduct = new Map<number, typeof existing>();
  for (const rec of existing) {
    const list = existingByProduct.get(rec.productId) ?? [];
    list.push(rec);
    existingByProduct.set(rec.productId, list);
  }

  let created = 0;
  let resolved = 0;

  await db.transaction(async (tx) => {
    for (const item of scored) {
      const currentlyUnresolved = existingByProduct.get(item.productId) ?? [];
      const currentTypes = new Set(item.candidates.map((c) => c.type));
      const existingTypes = new Set(currentlyUnresolved.map((r) => r.type));

      // Create recommendations for candidates that don't already have an
      // open (unresolved) row of the same type for this product.
      for (const candidate of item.candidates) {
        if (existingTypes.has(candidate.type)) continue;

        const [inserted] = await tx
          .insert(recommendations)
          .values({
            shopId,
            productId: item.productId,
            inventoryId: item.inventoryId,
            type: candidate.type,
            message: candidate.message,
            priority: candidate.priority,
            healthScoreAtGeneration: item.healthScore,
          })
          .$returningId();

        await logActivity(tx, {
          shopId,
          entityType: "recommendation",
          entityId: inserted.id,
          action: "recommendation_generated",
          description: candidate.message,
          metadata: { type: candidate.type, priority: candidate.priority },
        });

        created += 1;
      }

      // Resolve anything that WAS flagged but no longer applies (e.g. a
      // restock came in, or thresholds changed enough to fix it).
      const toResolve = currentlyUnresolved.filter((r) => !currentTypes.has(r.type));
      for (const rec of toResolve) {
        await tx
          .update(recommendations)
          .set({ isResolved: true, resolvedAt: new Date() })
          .where(eq(recommendations.id, rec.id));

        await logActivity(tx, {
          shopId,
          entityType: "recommendation",
          entityId: rec.id,
          action: "recommendation_resolved",
          description: `Recommendation resolved: ${rec.message}`,
        });

        resolved += 1;
      }
    }

    // Products that no longer have ANY active inventory row in `scored`
    // (e.g. archived since the last run) get all their open recommendations
    // resolved too — a recommendation about archived inventory is stale.
    const scoredProductIds = new Set(scored.map((item) => item.productId));
    const orphaned = existing.filter((rec) => !scoredProductIds.has(rec.productId));
    if (orphaned.length > 0) {
      await tx
        .update(recommendations)
        .set({ isResolved: true, resolvedAt: new Date() })
        .where(
          inArray(
            recommendations.id,
            orphaned.map((r) => r.id)
          )
        );
      resolved += orphaned.length;
    }
  });

  return { created, resolved, itemsScored: scored.length };
}

export async function listRecommendations(shopId: number, query: ListRecommendationsQuery) {
  const conditions = [eq(recommendations.shopId, shopId), eq(recommendations.isResolved, query.includeResolved ?? false)];
  if (query.priority) conditions.push(eq(recommendations.priority, query.priority));

  const rows = await db
    .select()
    .from(recommendations)
    .where(and(...conditions))
    .orderBy(desc(recommendations.createdAt))
    .limit(query.limit ?? 20);

  return rows;
}

export async function resolveRecommendation(shopId: number, recommendationId: number) {
  await db
    .update(recommendations)
    .set({ isResolved: true, resolvedAt: new Date() })
    .where(and(eq(recommendations.id, recommendationId), eq(recommendations.shopId, shopId)));

  await logActivity(db, {
    shopId,
    entityType: "recommendation",
    entityId: recommendationId,
    action: "recommendation_resolved",
    description: `Recommendation #${recommendationId} manually dismissed.`,
  });
}
