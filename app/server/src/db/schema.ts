import {
  mysqlTable,
  int,
  bigint,
  varchar,
  text,
  decimal,
  boolean,
  timestamp,
  mysqlEnum,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * ShroomHarvest — Smart Inventory Insights
 * Module 1 — Database Design
 *
 * Design notes (see APP_DECISIONS.md for the full rationale):
 * - Every merchant-owned row carries a shopId so the whole schema is
 *   naturally multi-tenant — one Shopify store's data can never leak
 *   into another's, even by a missed WHERE clause, once queries are
 *   built through the shop-scoped repository layer in Module 3.
 * - Money is stored as DECIMAL, never FLOAT, to avoid rounding drift.
 * - Enums are used for closed sets of values (status, role, priority)
 *   so invalid states are rejected at the database layer, not just in
 *   application code.
 * - inventoryHistory and activityLogs are intentionally append-only —
 *   nothing here is ever updated or deleted, only inserted, so the
 *   audit trail is always trustworthy.
 */

// ---------------------------------------------------------------------------
// Shops — one row per installed Shopify store. Root of the multi-tenant tree.
// ---------------------------------------------------------------------------
export const shops = mysqlTable(
  "shops",
  {
    id: int("id").autoincrement().primaryKey(),
    shopifyDomain: varchar("shopify_domain", { length: 255 }).notNull(),
    shopName: varchar("shop_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    planName: varchar("plan_name", { length: 64 }),
    isActive: boolean("is_active").notNull().default(true),
    installedAt: timestamp("installed_at").defaultNow().notNull(),
    uninstalledAt: timestamp("uninstalled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    shopifyDomainIdx: uniqueIndex("shops_shopify_domain_idx").on(table.shopifyDomain),
  })
);

// ---------------------------------------------------------------------------
// Users — staff accounts within a shop who use the embedded app.
// ---------------------------------------------------------------------------
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    shopId: int("shop_id")
      .notNull()
      .references(() => shops.id),
    shopifyUserId: bigint("shopify_user_id", { mode: "number" }),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 128 }),
    lastName: varchar("last_name", { length: 128 }),
    role: mysqlEnum("role", ["owner", "staff"]).notNull().default("staff"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    shopIdx: index("users_shop_id_idx").on(table.shopId),
    shopEmailIdx: uniqueIndex("users_shop_email_idx").on(table.shopId, table.email),
  })
);

// ---------------------------------------------------------------------------
// Suppliers — who a shop sources mushroom products from.
// ---------------------------------------------------------------------------
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    shopId: int("shop_id")
      .notNull()
      .references(() => shops.id),
    name: varchar("name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 64 }),
    leadTimeDays: int("lead_time_days").notNull().default(7),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    shopIdx: index("suppliers_shop_id_idx").on(table.shopId),
  })
);

// ---------------------------------------------------------------------------
// Products — mirrors the Shopify product/variant this row tracks inventory for.
// ---------------------------------------------------------------------------
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    shopId: int("shop_id")
      .notNull()
      .references(() => shops.id),
    shopifyProductId: bigint("shopify_product_id", { mode: "number" }),
    shopifyVariantId: bigint("shopify_variant_id", { mode: "number" }),
    title: varchar("title", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 128 }),
    category: mysqlEnum("category", [
      "fresh_mushrooms",
      "dried_mushrooms",
      "mushroom_coffee",
      "mushroom_tea",
      "mushroom_powders",
      "mushroom_supplements",
      "grow_kits",
      "gift_boxes",
    ]).notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
    imageUrl: varchar("image_url", { length: 1024 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    shopIdx: index("products_shop_id_idx").on(table.shopId),
    skuIdx: index("products_sku_idx").on(table.sku),
  })
);

// ---------------------------------------------------------------------------
// Inventory — the live stock record for one product at one shop.
// One row per product (this is a single-location model; multi-location
// is listed as a future improvement in APP_DECISIONS.md).
// ---------------------------------------------------------------------------
export const inventory = mysqlTable(
  "inventory",
  {
    id: int("id").autoincrement().primaryKey(),
    shopId: int("shop_id")
      .notNull()
      .references(() => shops.id),
    productId: int("product_id")
      .notNull()
      .references(() => products.id),
    supplierId: int("supplier_id").references(() => suppliers.id),
    quantityOnHand: int("quantity_on_hand").notNull().default(0),
    reorderPoint: int("reorder_point").notNull().default(10),
    reorderQuantity: int("reorder_quantity").notNull().default(20),
    safetyStock: int("safety_stock").notNull().default(5),
    lowStockThreshold: int("low_stock_threshold").notNull().default(10),
    avgDailySales: decimal("avg_daily_sales", { precision: 10, scale: 2 }).default("0.00"),
    status: mysqlEnum("status", ["in_stock", "low_stock", "out_of_stock", "archived"])
      .notNull()
      .default("in_stock"),
    lastRestockedAt: timestamp("last_restocked_at"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    shopIdx: index("inventory_shop_id_idx").on(table.shopId),
    productIdx: uniqueIndex("inventory_product_id_idx").on(table.productId),
    supplierIdx: index("inventory_supplier_id_idx").on(table.supplierId),
    statusIdx: index("inventory_status_idx").on(table.status),
  })
);

// ---------------------------------------------------------------------------
// InventoryHistory — append-only ledger of every stock quantity change.
// ---------------------------------------------------------------------------
export const inventoryHistory = mysqlTable(
  "inventory_history",
  {
    id: int("id").autoincrement().primaryKey(),
    inventoryId: int("inventory_id")
      .notNull()
      .references(() => inventory.id),
    changeType: mysqlEnum("change_type", [
      "restock",
      "sale",
      "manual_adjustment",
      "archive",
      "unarchive",
      "threshold_change",
    ]).notNull(),
    quantityBefore: int("quantity_before").notNull(),
    quantityAfter: int("quantity_after").notNull(),
    delta: int("delta").notNull(),
    note: text("note"),
    createdByUserId: int("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    inventoryIdx: index("inventory_history_inventory_id_idx").on(table.inventoryId),
    createdAtIdx: index("inventory_history_created_at_idx").on(table.createdAt),
  })
);

// ---------------------------------------------------------------------------
// Recommendations — output of the Inventory Health Score engine (Module 7).
// ---------------------------------------------------------------------------
export const recommendations = mysqlTable(
  "recommendations",
  {
    id: int("id").autoincrement().primaryKey(),
    shopId: int("shop_id")
      .notNull()
      .references(() => shops.id),
    productId: int("product_id")
      .notNull()
      .references(() => products.id),
    inventoryId: int("inventory_id")
      .notNull()
      .references(() => inventory.id),
    type: mysqlEnum("type", [
      "restock_urgent",
      "restock_soon",
      "increase_before_demand",
      "reduce_reorder_quantity",
      "supplier_lead_time_risk",
    ]).notNull(),
    message: varchar("message", { length: 512 }).notNull(),
    priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).notNull(),
    healthScoreAtGeneration: int("health_score_at_generation"),
    isResolved: boolean("is_resolved").notNull().default(false),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    shopIdx: index("recommendations_shop_id_idx").on(table.shopId),
    productIdx: index("recommendations_product_id_idx").on(table.productId),
    unresolvedIdx: index("recommendations_is_resolved_idx").on(table.isResolved),
  })
);

// ---------------------------------------------------------------------------
// ActivityLogs — append-only feed of every meaningful action in the app.
// ---------------------------------------------------------------------------
export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    shopId: int("shop_id")
      .notNull()
      .references(() => shops.id),
    userId: int("user_id").references(() => users.id),
    entityType: mysqlEnum("entity_type", [
      "product",
      "inventory",
      "supplier",
      "recommendation",
    ]).notNull(),
    entityId: int("entity_id").notNull(),
    action: mysqlEnum("action", [
      "product_created",
      "product_updated",
      "inventory_updated",
      "inventory_archived",
      "inventory_unarchived",
      "threshold_changed",
      "supplier_created",
      "supplier_updated",
      "recommendation_generated",
      "recommendation_resolved",
    ]).notNull(),
    description: varchar("description", { length: 512 }).notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    shopIdx: index("activity_logs_shop_id_idx").on(table.shopId),
    entityIdx: index("activity_logs_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("activity_logs_created_at_idx").on(table.createdAt),
  })
);

// ---------------------------------------------------------------------------
// Sessions — Shopify OAuth session storage (offline access tokens + online
// session-token-derived sessions for the embedded app). Keyed by the same
// session id format the Shopify library generates (e.g. `offline_{shop}`).
// ---------------------------------------------------------------------------
export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    shopId: int("shop_id").references(() => shops.id),
    shop: varchar("shop", { length: 255 }).notNull(),
    state: varchar("state", { length: 255 }).notNull().default(""),
    isOnline: boolean("is_online").notNull().default(false),
    scope: varchar("scope", { length: 1024 }),
    accessToken: varchar("access_token", { length: 512 }),
    expires: timestamp("expires"),
    onlineAccessInfo: json("online_access_info"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    shopIdx: index("sessions_shop_idx").on(table.shop),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  shopRecord: one(shops, { fields: [sessions.shopId], references: [shops.id] }),
}));

// ---------------------------------------------------------------------------
// Relations — enables Drizzle's relational query API (db.query.shops.findMany
// with `.with: { users: true }`, etc.) used throughout Modules 3-7.
// ---------------------------------------------------------------------------
export const shopsRelations = relations(shops, ({ many }) => ({
  users: many(users),
  suppliers: many(suppliers),
  products: many(products),
  inventory: many(inventory),
  recommendations: many(recommendations),
  activityLogs: many(activityLogs),
  sessions: many(sessions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  shop: one(shops, { fields: [users.shopId], references: [shops.id] }),
  activityLogs: many(activityLogs),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  shop: one(shops, { fields: [suppliers.shopId], references: [shops.id] }),
  inventory: many(inventory),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, { fields: [products.shopId], references: [shops.id] }),
  inventory: one(inventory, { fields: [products.id], references: [inventory.productId] }),
  recommendations: many(recommendations),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  shop: one(shops, { fields: [inventory.shopId], references: [shops.id] }),
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
  supplier: one(suppliers, { fields: [inventory.supplierId], references: [suppliers.id] }),
  history: many(inventoryHistory),
  recommendations: many(recommendations),
}));

export const inventoryHistoryRelations = relations(inventoryHistory, ({ one }) => ({
  inventory: one(inventory, { fields: [inventoryHistory.inventoryId], references: [inventory.id] }),
  createdByUser: one(users, { fields: [inventoryHistory.createdByUserId], references: [users.id] }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  shop: one(shops, { fields: [recommendations.shopId], references: [shops.id] }),
  product: one(products, { fields: [recommendations.productId], references: [products.id] }),
  inventory: one(inventory, { fields: [recommendations.inventoryId], references: [inventory.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  shop: one(shops, { fields: [activityLogs.shopId], references: [shops.id] }),
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));
