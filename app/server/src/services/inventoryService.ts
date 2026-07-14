import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { inventory, products, suppliers } from "../db/schema.js";
import { NotFoundError } from "../lib/errors.js";
import type { ListInventoryQuery } from "../validators/inventory.validators.js";

/**
 * Only read operations live here in Module 3 — create/update/archive/adjust
 * workflows (with their own validation and activity logging) are built out
 * in Module 5 (Inventory Management). This module's job is proving the
 * foundation (routing, validation, joins, pagination, error handling)
 * works end to end.
 */
export async function listInventory(shopId: number, query: ListInventoryQuery) {
  const conditions = [eq(inventory.shopId, shopId)];
  if (query.status) conditions.push(eq(inventory.status, query.status));
  if (query.supplierId) conditions.push(eq(inventory.supplierId, query.supplierId));

  const where = and(...conditions);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        inventory,
        product: products,
        supplier: suppliers,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
      .where(where)
      .limit(query.pageSize)
      .offset(offset)
      .orderBy(desc(inventory.updatedAt)),
    db.select({ total: count() }).from(inventory).where(where),
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

export async function getInventoryById(shopId: number, inventoryId: number) {
  const [row] = await db
    .select({
      inventory,
      product: products,
      supplier: suppliers,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
    .where(and(eq(inventory.id, inventoryId), eq(inventory.shopId, shopId)))
    .limit(1);

  if (!row) throw new NotFoundError("Inventory record");
  return row;
}
