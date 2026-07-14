import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { inventory, inventoryHistory, products } from "../db/schema.js";
import { NotFoundError } from "../lib/errors.js";
import { computeInventoryStatus } from "../lib/inventoryStatus.js";
import { logActivity } from "./activityLogService.js";
import type { CreateProductInput, ListProductsQuery } from "../validators/product.validators.js";

// Same shape as `db`, or a transaction object — used so the "read back what
// we just wrote" step inside createProduct stays within the same
// transaction instead of possibly racing a separate connection.
type Executor = Pick<typeof db, "select">;

async function fetchProductWithInventory(executor: Executor, shopId: number, productId: number) {
  const [product] = await executor
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.shopId, shopId)))
    .limit(1);

  if (!product) throw new NotFoundError("Product");

  const [inventoryRow] = await executor
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId))
    .limit(1);

  return { ...product, inventory: inventoryRow ?? null };
}

export async function listProducts(shopId: number, query: ListProductsQuery) {
  const conditions = [eq(products.shopId, shopId)];
  if (query.category) conditions.push(eq(products.category, query.category));
  if (query.isActive !== undefined) conditions.push(eq(products.isActive, query.isActive));

  const where = and(...conditions);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(products).where(where).limit(query.pageSize).offset(offset).orderBy(desc(products.createdAt)),
    db.select({ total: count() }).from(products).where(where),
  ]);

  return {
    data: rows,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getProductById(shopId: number, productId: number) {
  return fetchProductWithInventory(db, shopId, productId);
}

/**
 * Creates a product AND its inventory record in one transaction — a
 * product without inventory would break the dashboard (Module 4) and the
 * recommendation engine (Module 7), so the two are never allowed to exist
 * independently. Also writes the initial stock history entry and an
 * activity log, matching the "every important action generates an
 * activity log" requirement.
 */
export async function createProduct(shopId: number, input: CreateProductInput) {
  return db.transaction(async (tx) => {
    const [productResult] = await tx
      .insert(products)
      .values({
        shopId,
        title: input.title,
        sku: input.sku,
        category: input.category,
        unitCost: input.unitCost?.toFixed(2),
        unitPrice: input.unitPrice?.toFixed(2),
        imageUrl: input.imageUrl,
      })
      .$returningId();

    const initialStatus = computeInventoryStatus(input.initialQuantity, input.lowStockThreshold);

    const [inventoryResult] = await tx
      .insert(inventory)
      .values({
        shopId,
        productId: productResult.id,
        supplierId: input.supplierId,
        quantityOnHand: input.initialQuantity,
        reorderPoint: input.reorderPoint,
        reorderQuantity: input.reorderQuantity,
        lowStockThreshold: input.lowStockThreshold,
        status: initialStatus,
        lastRestockedAt: input.initialQuantity > 0 ? new Date() : null,
      })
      .$returningId();

    await tx.insert(inventoryHistory).values({
      inventoryId: inventoryResult.id,
      changeType: "restock",
      quantityBefore: 0,
      quantityAfter: input.initialQuantity,
      delta: input.initialQuantity,
      note: "Initial stock on product creation.",
    });

    await logActivity(tx, {
      shopId,
      entityType: "product",
      entityId: productResult.id,
      action: "product_created",
      description: `${input.title} added to inventory.`,
      metadata: { sku: input.sku, category: input.category },
    });

    return fetchProductWithInventory(tx, shopId, productResult.id);
  });
}
