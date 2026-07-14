import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { suppliers } from "../db/schema.js";
import { NotFoundError } from "../lib/errors.js";
import { logActivity } from "./activityLogService.js";
import type { CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from "../validators/supplier.validators.js";

export async function listSuppliers(shopId: number, query: ListSuppliersQuery) {
  const conditions = [eq(suppliers.shopId, shopId)];
  if (query.isActive !== undefined) conditions.push(eq(suppliers.isActive, query.isActive));

  const where = and(...conditions);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(suppliers).where(where).limit(query.pageSize).offset(offset).orderBy(desc(suppliers.createdAt)),
    db.select({ total: count() }).from(suppliers).where(where),
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

export async function getSupplierById(shopId: number, supplierId: number) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)))
    .limit(1);

  if (!supplier) throw new NotFoundError("Supplier");
  return supplier;
}

export async function createSupplier(shopId: number, input: CreateSupplierInput) {
  return db.transaction(async (tx) => {
    const [result] = await tx
      .insert(suppliers)
      .values({
        shopId,
        name: input.name,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        leadTimeDays: input.leadTimeDays,
        notes: input.notes,
      })
      .$returningId();

    await logActivity(tx, {
      shopId,
      entityType: "supplier",
      entityId: result.id,
      action: "supplier_created",
      description: `${input.name} added as a supplier.`,
    });

    const [supplier] = await tx.select().from(suppliers).where(eq(suppliers.id, result.id)).limit(1);
    return supplier;
  });
}

/**
 * Partial update — supports both editing contact/lead-time info and
 * deactivating a supplier (isActive: false) through the same endpoint,
 * since a supplier "archive" is really just this one field flipping.
 */
export async function updateSupplier(shopId: number, supplierId: number, input: UpdateSupplierInput) {
  await getSupplierById(shopId, supplierId); // throws NotFoundError if missing/wrong shop

  return db.transaction(async (tx) => {
    await tx
      .update(suppliers)
      .set(input)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)));

    await logActivity(tx, {
      shopId,
      entityType: "supplier",
      entityId: supplierId,
      action: "supplier_updated",
      description: `Supplier #${supplierId} updated.`,
      metadata: { changes: input },
    });

    const [supplier] = await tx
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)))
      .limit(1);

    return supplier;
  });
}
