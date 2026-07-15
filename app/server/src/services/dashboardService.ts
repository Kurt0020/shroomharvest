import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { activityLogs, inventory, products, suppliers } from "../db/schema.js";
import { getShopHealthScore } from "./recommendationService.js";
import { listRecommendations } from "./recommendationService.js";

export async function getDashboardSummary(shopId: number) {
  const shopInventory = await db
    .select({
      inventory,
      product: products,
      supplier: suppliers,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
    .where(and(eq(inventory.shopId, shopId), sql`${inventory.status} != 'archived'`));

  const counts = { inStock: 0, lowStock: 0, outOfStock: 0 };
  let totalInventoryValue = 0;

  for (const row of shopInventory) {
    if (row.inventory.status === "in_stock") counts.inStock += 1;
    else if (row.inventory.status === "low_stock") counts.lowStock += 1;
    else if (row.inventory.status === "out_of_stock") counts.outOfStock += 1;

    const unitCost = row.product.unitCost ? Number(row.product.unitCost) : 0;
    totalInventoryValue += unitCost * row.inventory.quantityOnHand;
  }

  // Module 7's real weighted formula (sales velocity, days remaining,
  // supplier lead time) replaces Module 4's "share of healthy inventory"
  // placeholder. Lives in recommendationService.ts / recommendationEngine.ts
  // since the dashboard and the recommendations table both need the same
  // per-item scoring — one calculation, two consumers.
  const healthScore = await getShopHealthScore(shopId);
  const smartRecommendations = await listRecommendations(shopId, { limit: 6, includeResolved: false });

  const bySalesVelocity = [...shopInventory].sort(
    (a, b) => Number(b.inventory.avgDailySales ?? 0) - Number(a.inventory.avgDailySales ?? 0)
  );
  const fastSelling = bySalesVelocity.slice(0, 5);
  const slowSelling = [...bySalesVelocity].reverse().slice(0, 5);

  const restockPriorities = shopInventory
    .filter((row) => row.inventory.status === "low_stock" || row.inventory.status === "out_of_stock")
    .sort((a, b) => {
      // Out-of-stock first, then by how far under the reorder point.
      if (a.inventory.status !== b.inventory.status) {
        return a.inventory.status === "out_of_stock" ? -1 : 1;
      }
      const aGap = a.inventory.reorderPoint - a.inventory.quantityOnHand;
      const bGap = b.inventory.reorderPoint - b.inventory.quantityOnHand;
      return bGap - aGap;
    })
    .slice(0, 8);

  const categoryBreakdown = Object.values(
    shopInventory.reduce<Record<string, { category: string; productCount: number; totalQuantity: number }>>(
      (acc, row) => {
        const key = row.product.category;
        acc[key] ??= { category: key, productCount: 0, totalQuantity: 0 };
        acc[key].productCount += 1;
        acc[key].totalQuantity += row.inventory.quantityOnHand;
        return acc;
      },
      {}
    )
  );

  const recentActivity = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.shopId, shopId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(10);

  return {
    healthScore,
    kpis: {
      totalProducts: shopInventory.length,
      lowStockCount: counts.lowStock,
      outOfStockCount: counts.outOfStock,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    },
    fastSelling,
    slowSelling,
    restockPriorities,
    categoryBreakdown,
    recentActivity,
    smartRecommendations,
  };
}
