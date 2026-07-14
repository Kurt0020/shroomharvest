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
  leadTimeDays: number;
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

export interface ActivityLogEntry {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
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
