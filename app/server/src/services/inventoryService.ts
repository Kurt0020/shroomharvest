import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { inventory, inventoryHistory, products, suppliers } from "../db/schema.js";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors.js";
import { computeInventoryStatus } from "../lib/inventoryStatus.js";
import { logActivity } from "./activityLogService.js";
import type { AdjustStockInput, ListInventoryQuery, UpdateInventoryInput } from "../validators/inventory.validators.js";

/**
 * Read operations (list/get) were built in Module 3 to prove the
 * foundation works end to end. Module 5 adds the write workflows below:
 * threshold updates, stock adjustments, and archive/unarchive — each one
 * a transaction that updates `inventory`, appends an `inventory_history`
 * row, and writes an `activity_logs` entry atomically.
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

// Same shape as `db`, or a transaction object — lets the "read back what we
// just wrote" step inside each workflow below stay within the same
// transaction instead of racing a separate connection (the same class of
// bug fixed in productService.ts's createProduct).
type Executor = Pick<typeof db, "select">;

async function fetchInventoryWithJoins(executor: Executor, shopId: number, inventoryId: number) {
  const [row] = await executor
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

export async function getInventoryById(shopId: number, inventoryId: number) {
  return fetchInventoryWithJoins(db, shopId, inventoryId);
}

/** Internal: fetch a bare inventory row (no joins) scoped to the shop, or throw. */
async function fetchOwnedInventoryRow(shopId: number, inventoryId: number) {
  const [row] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.id, inventoryId), eq(inventory.shopId, shopId)))
    .limit(1);

  if (!row) throw new NotFoundError("Inventory record");
  return row;
}

/**
 * Updates reorder/threshold configuration. If `lowStockThreshold` changes,
 * the row's status is recomputed immediately — a merchant lowering their
 * threshold below current stock should see "in stock" right away, not wait
 * for the next sale/restock to trigger a status recalculation.
 */
export async function updateInventoryThresholds(
  shopId: number,
  inventoryId: number,
  input: UpdateInventoryInput
) {
  const existing = await fetchOwnedInventoryRow(shopId, inventoryId);
  if (existing.status === "archived") {
    throw new ConflictError("Cannot update thresholds on an archived inventory record.");
  }

  const newLowStockThreshold = input.lowStockThreshold ?? existing.lowStockThreshold;
  // Already guarded against "archived" above, so this is always in_stock/low_stock/out_of_stock.
  const newStatus = computeInventoryStatus(existing.quantityOnHand, newLowStockThreshold);

  return db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({
        supplierId: input.supplierId === null ? null : (input.supplierId ?? existing.supplierId),
        reorderPoint: input.reorderPoint ?? existing.reorderPoint,
        reorderQuantity: input.reorderQuantity ?? existing.reorderQuantity,
        lowStockThreshold: newLowStockThreshold,
        safetyStock: input.safetyStock ?? existing.safetyStock,
        status: newStatus,
      })
      .where(eq(inventory.id, inventoryId));

    await logActivity(tx, {
      shopId,
      entityType: "inventory",
      entityId: inventoryId,
      action: "threshold_changed",
      description: `Thresholds updated for inventory #${inventoryId}.`,
      metadata: { before: existing, changes: input },
    });

    return fetchInventoryWithJoins(tx, shopId, inventoryId);
  });
}

/**
 * Adjusts quantity on hand by a delta (positive = restock, negative =
 * sale/spoilage/correction), recomputes status, and appends both a stock
 * history entry and an activity log entry — all in one transaction so the
 * quantity and its audit trail can never drift apart.
 */
export async function adjustStock(shopId: number, inventoryId: number, input: AdjustStockInput) {
  const existing = await fetchOwnedInventoryRow(shopId, inventoryId);
  if (existing.status === "archived") {
    throw new ConflictError("Cannot adjust stock on an archived inventory record.");
  }

  const newQuantity = existing.quantityOnHand + input.delta;
  if (newQuantity < 0) {
    throw new ValidationError(
      `Adjustment would result in negative stock (${existing.quantityOnHand} + ${input.delta} = ${newQuantity}).`
    );
  }

  const changeType = input.changeType ?? (input.delta > 0 ? "restock" : "sale");
  const newStatus = computeInventoryStatus(newQuantity, existing.lowStockThreshold);

  return db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({
        quantityOnHand: newQuantity,
        status: newStatus,
        lastRestockedAt: changeType === "restock" ? new Date() : existing.lastRestockedAt,
      })
      .where(eq(inventory.id, inventoryId));

    await tx.insert(inventoryHistory).values({
      inventoryId,
      changeType,
      quantityBefore: existing.quantityOnHand,
      quantityAfter: newQuantity,
      delta: input.delta,
      note: input.note,
    });

    await logActivity(tx, {
      shopId,
      entityType: "inventory",
      entityId: inventoryId,
      action: "inventory_updated",
      description: `Stock ${input.delta > 0 ? "increased" : "decreased"} by ${Math.abs(input.delta)} (${changeType}).`,
      metadata: { changeType, quantityBefore: existing.quantityOnHand, quantityAfter: newQuantity },
    });

    return fetchInventoryWithJoins(tx, shopId, inventoryId);
  });
}

/** Archives an inventory record — excluded from active dashboard/recommendation logic. */
export async function archiveInventory(shopId: number, inventoryId: number) {
  const existing = await fetchOwnedInventoryRow(shopId, inventoryId);
  if (existing.status === "archived") {
    throw new ConflictError("Inventory record is already archived.");
  }

  return db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({ status: "archived", archivedAt: new Date() })
      .where(eq(inventory.id, inventoryId));

    await tx.insert(inventoryHistory).values({
      inventoryId,
      changeType: "archive",
      quantityBefore: existing.quantityOnHand,
      quantityAfter: existing.quantityOnHand,
      delta: 0,
      note: "Inventory archived.",
    });

    await logActivity(tx, {
      shopId,
      entityType: "inventory",
      entityId: inventoryId,
      action: "inventory_archived",
      description: `Inventory #${inventoryId} archived.`,
    });

    return fetchInventoryWithJoins(tx, shopId, inventoryId);
  });
}

/** Restores a previously-archived inventory record, recomputing its status from current quantity. */
export async function unarchiveInventory(shopId: number, inventoryId: number) {
  const existing = await fetchOwnedInventoryRow(shopId, inventoryId);
  if (existing.status !== "archived") {
    throw new ConflictError("Inventory record is not archived.");
  }

  const restoredStatus = computeInventoryStatus(existing.quantityOnHand, existing.lowStockThreshold);

  return db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({ status: restoredStatus, archivedAt: null })
      .where(eq(inventory.id, inventoryId));

    await tx.insert(inventoryHistory).values({
      inventoryId,
      changeType: "unarchive",
      quantityBefore: existing.quantityOnHand,
      quantityAfter: existing.quantityOnHand,
      delta: 0,
      note: "Inventory unarchived.",
    });

    await logActivity(tx, {
      shopId,
      entityType: "inventory",
      entityId: inventoryId,
      action: "inventory_unarchived",
      description: `Inventory #${inventoryId} unarchived.`,
    });

    return fetchInventoryWithJoins(tx, shopId, inventoryId);
  });
}
