import type { DashboardSummary } from "../types/dashboard.js";

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
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch("/api/dashboard/summary");

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? `Request failed with status ${res.status}`, res.status);
  }

  const body = (await res.json()) as { data: DashboardSummary };
  return body.data;
}
