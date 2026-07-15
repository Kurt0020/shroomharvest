import type { ActivityLogEntry, DashboardSummary, InventoryRow, Paginated, Recommendation, Supplier } from "../types/dashboard.js";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/**
 * Plain fetch is enough here — App Bridge 4's CDN script auto-attaches the
 * session token to same-origin requests (see Module 2). No custom wrapper
 * needed.
 *
 * Explicitly handles 204/empty bodies (e.g. resolveRecommendation below) —
 * calling res.json() on an empty body throws "Unexpected end of JSON
 * input", the same class of bug fixed in verifyRequest.ts back in Module 2.
 */
async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? `Request failed with status ${res.status}`, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const body = await apiFetch<{ data: DashboardSummary }>("/api/dashboard/summary");
  return body.data;
}

export async function fetchInventory(): Promise<Paginated<InventoryRow>> {
  return apiFetch<Paginated<InventoryRow>>("/api/inventory?pageSize=100");
}

export async function adjustStock(inventoryId: number, delta: number, note?: string) {
  const body = await apiFetch<{ data: InventoryRow }>(`/api/inventory/${inventoryId}/adjust`, {
    method: "POST",
    body: JSON.stringify({ delta, note }),
  });
  return body.data;
}

export async function updateInventoryThresholds(
  inventoryId: number,
  input: Partial<{
    supplierId: number | null;
    reorderPoint: number;
    reorderQuantity: number;
    lowStockThreshold: number;
    safetyStock: number;
  }>
) {
  const body = await apiFetch<{ data: InventoryRow }>(`/api/inventory/${inventoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return body.data;
}

export async function archiveInventory(inventoryId: number) {
  const body = await apiFetch<{ data: InventoryRow }>(`/api/inventory/${inventoryId}/archive`, { method: "POST" });
  return body.data;
}

export async function unarchiveInventory(inventoryId: number) {
  const body = await apiFetch<{ data: InventoryRow }>(`/api/inventory/${inventoryId}/unarchive`, { method: "POST" });
  return body.data;
}

export async function fetchSuppliers(): Promise<Paginated<Supplier>> {
  return apiFetch<Paginated<Supplier>>("/api/suppliers?pageSize=100");
}

export async function createSupplier(input: {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  leadTimeDays?: number;
  notes?: string;
}) {
  const body = await apiFetch<{ data: Supplier }>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return body.data;
}

export async function updateSupplier(
  supplierId: number,
  input: Partial<{
    name: string;
    contactEmail: string;
    contactPhone: string;
    leadTimeDays: number;
    notes: string;
    isActive: boolean;
  }>
) {
  const body = await apiFetch<{ data: Supplier }>(`/api/suppliers/${supplierId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return body.data;
}

export interface ActivityFilters {
  entityType?: string;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

export async function fetchActivity(filters: ActivityFilters = {}): Promise<Paginated<ActivityLogEntry>> {
  const params = new URLSearchParams();
  params.set("pageSize", "50");
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  if (filters.search) params.set("search", filters.search);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.page) params.set("page", String(filters.page));

  return apiFetch<Paginated<ActivityLogEntry>>(`/api/activity?${params.toString()}`);
}

export interface RecommendationFilters {
  priority?: string;
  includeResolved?: boolean;
  limit?: number;
}

export async function fetchRecommendations(filters: RecommendationFilters = {}): Promise<Recommendation[]> {
  const params = new URLSearchParams();
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.includeResolved) params.set("includeResolved", "true");
  params.set("limit", String(filters.limit ?? 50));

  const body = await apiFetch<{ data: Recommendation[] }>(`/api/recommendations?${params.toString()}`);
  return body.data;
}

export interface GenerateRecommendationsResult {
  created: number;
  resolved: number;
  itemsScored: number;
}

/**
 * Runs the recommendation engine on demand — there's no background job
 * scheduler in this project, so a merchant (or the dashboard) triggers a
 * fresh reconciliation pass manually. See recommendationService.ts for the
 * actual engine logic.
 */
export async function generateRecommendations(): Promise<GenerateRecommendationsResult> {
  const body = await apiFetch<{ data: GenerateRecommendationsResult }>("/api/recommendations/generate", {
    method: "POST",
  });
  return body.data;
}

export async function resolveRecommendation(id: number): Promise<void> {
  await apiFetch<void>(`/api/recommendations/${id}/resolve`, { method: "POST" });
}
