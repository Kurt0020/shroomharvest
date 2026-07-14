export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock" | "archived";

/**
 * Single source of truth for "what status should this inventory row have,
 * given its current quantity and threshold." Used at product creation
 * (Module 3), stock adjustment, and threshold updates (Module 5) so the
 * status logic can't drift between call sites.
 */
export function computeInventoryStatus(
  quantityOnHand: number,
  lowStockThreshold: number
): Exclude<InventoryStatus, "archived"> {
  if (quantityOnHand <= 0) return "out_of_stock";
  if (quantityOnHand <= lowStockThreshold) return "low_stock";
  return "in_stock";
}
