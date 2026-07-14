import { activityLogs } from "../db/schema.js";
import type { db as DbClient } from "../db/client.js";

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
