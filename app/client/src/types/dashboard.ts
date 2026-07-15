export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type ProductCategory =
  | "fresh_mushrooms"
  | "dried_mushrooms"
  | "mushroom_coffee"
  | "mushroom_tea"
  | "mushroom_powders"
  | "mushroom_supplements"
  | "grow_kits"
  | "gift_boxes";

export interface Product {
  id: number;
  title: string;
  sku: string | null;
  category: ProductCategory;
  unitCost: string | null;
  unitPrice: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  leadTimeDays: number;
  notes: string | null;
  isActive: boolean;
}

export interface InventoryRecord {
  id: number;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number;
  lowStockThreshold: number;
  avgDailySales: string | null;
  status: "in_stock" | "low_stock" | "out_of_stock" | "archived";
}

export interface InventoryRow {
  inventory: InventoryRecord;
  product: Product;
  supplier: Supplier | null;
}

export const ACTIVITY_ENTITY_TYPES = ["product", "inventory", "supplier", "recommendation"] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export const ACTIVITY_ACTIONS = [
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
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface ActivityLogEntry {
  id: number;
  entityType: ActivityEntityType;
  entityId: number;
  action: ActivityAction;
  description: string;
  createdAt: string;
}

export interface CategoryBreakdownEntry {
  category: ProductCategory;
  productCount: number;
  totalQuantity: number;
}

export interface DashboardSummary {
  healthScore: number;
  kpis: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
  };
  fastSelling: InventoryRow[];
  slowSelling: InventoryRow[];
  restockPriorities: InventoryRow[];
  categoryBreakdown: CategoryBreakdownEntry[];
  recentActivity: ActivityLogEntry[];
}

export type RecommendationType =
  | "restock_urgent"
  | "restock_soon"
  | "increase_before_demand"
  | "reduce_reorder_quantity"
  | "supplier_lead_time_risk";

export type RecommendationPriority = "low" | "medium" | "high" | "critical";

export interface Recommendation {
  id: number;
  shopId: number;
  productId: number;
  inventoryId: number;
  type: RecommendationType;
  message: string;
  priority: RecommendationPriority;
  healthScoreAtGeneration: number | null;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}
