import { and, count, desc, eq, gte, like, lte } from "drizzle-orm";
import { db } from "../db/client.js";
import { activityLogs } from "../db/schema.js";
import type { db as DbClient } from "../db/client.js";
import type { ListActivityQuery } from "../validators/activity.validators.js";

// Accepts either the shared `db` client or a transaction object (`tx`) —
// both expose the same `.insert(...)` query builder shape structurally,
// so we only need to type the slice of the interface this function uses.
type Executor = Pick<typeof DbClient, "insert">;

interface LogActivityInput {
  shopId: number;
  userId?: number | null;
  entityType: "product" | "inventory" | "supplier" | "recommendation";
  entityId: number;
  action:
    | "product_created"
    | "product_updated"
    | "inventory_updated"
    | "inventory_archived"
    | "inventory_unarchived"
    | "threshold_changed"
    | "supplier_created"
    | "supplier_updated"
    | "recommendation_generated"
    | "recommendation_resolved";
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Every mutation in the app is supposed to leave an activity log entry
 * (Module 6 builds the UI that reads these). Centralizing the insert here
 * means services can't forget the `metadata` shape or the enum values —
 * one call site to update if the log format ever changes.
 *
 * Accepts either the shared `db` client or a transaction object (`tx`) so
 * callers can log within the same transaction as the mutation itself,
 * keeping the log and the change it describes atomic.
 */
export async function logActivity(executor: Executor, input: LogActivityInput) {
  await executor.insert(activityLogs).values({
    shopId: input.shopId,
    userId: input.userId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    description: input.description,
    metadata: input.metadata ?? null,
  });
}

/**
 * Powers the Activity Tracking screen: filterable by entity type, action,
 * free-text search over the description, and a date range, always scoped
 * to the shop and always newest-first (this is a history/timeline view,
 * not a table you'd want re-sorted).
 */
export async function listActivity(shopId: number, query: ListActivityQuery) {
  const conditions = [eq(activityLogs.shopId, shopId)];

  if (query.entityType) conditions.push(eq(activityLogs.entityType, query.entityType));
  if (query.action) conditions.push(eq(activityLogs.action, query.action));
  if (query.search) conditions.push(like(activityLogs.description, `%${query.search}%`));
  if (query.startDate) conditions.push(gte(activityLogs.createdAt, query.startDate));
  if (query.endDate) conditions.push(lte(activityLogs.createdAt, query.endDate));

  const where = and(...conditions);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(activityLogs)
      .where(where)
      .orderBy(desc(activityLogs.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(activityLogs).where(where),
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
