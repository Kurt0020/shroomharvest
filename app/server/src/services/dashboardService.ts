import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { activityLogs, inventory, products, suppliers } from "../db/schema.js";

/**
 * The Inventory Health Score here is intentionally a simplified placeholder:
 * the share of active inventory that isn't low/out of stock, expressed as
 * 0-100. Module 7 (Recommendation Engine) replaces this with the real
 * weighted formula (current inventory, sales velocity, days remaining,
 * supplier lead time). This module's job is proving the dashboard's shape
 * — KPI cards, lists, and a chart — works end to end against real data.
 */
function computeHealthScore(counts: { inStock: number; lowStock: number; outOfStock: number }) {
  const total = counts.inStock + counts.lowStock + counts.outOfStock;
  if (total === 0) return 100;
  // Out-of-stock hurts twice as much as low-stock in this simplified model.
  const penalized = counts.lowStock * 0.5 + counts.outOfStock * 1;
  const score = Math.round(100 * (1 - penalized / total));
  return Math.max(0, Math.min(100, score));
}

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

  const healthScore = computeHealthScore(counts);

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
  };
}
