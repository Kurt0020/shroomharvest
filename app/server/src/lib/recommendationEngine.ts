/**
 * ShroomHarvest — Smart Inventory Insights
 * Module 7 — Recommendation Engine
 *
 * Replaces Module 4's simplified "share of healthy inventory" health score
 * with the real formula: current inventory, sales velocity, days remaining,
 * and supplier lead time. Kept as pure functions (no DB access) so the
 * scoring logic is easy to reason about and change independently of how
 * it's wired into the dashboard or the recommendations table.
 */

export const DEFAULT_LEAD_TIME_DAYS = 7;

export interface HealthScoreInput {
  quantityOnHand: number;
  avgDailySales: number;
  safetyStock: number;
  leadTimeDays: number | null;
}

/**
 * How many days of stock remain at the current sales pace.
 * - No sales velocity data yet, but stock on hand: treated as "ample" (not
 *   penalized for lack of data — a new product shouldn't score as at-risk
 *   just because it hasn't sold anything yet).
 * - Zero stock: always 0 regardless of velocity.
 */
export function computeDaysRemaining(quantityOnHand: number, avgDailySales: number): number {
  if (quantityOnHand <= 0) return 0;
  if (avgDailySales <= 0) return Infinity;
  return quantityOnHand / avgDailySales;
}

/**
 * 0-100 score for a single inventory item.
 *
 * The core idea: what matters isn't "how much stock do I have" in
 * isolation, it's "will I run out before a reorder can arrive." That's
 * `daysRemaining` measured against the supplier's lead time
 * (`coverageRatio`), not against an arbitrary fixed number of days.
 *
 *  - coverageRatio >= 2   → 100 (comfortably more runway than a full
 *                            reorder cycle would need)
 *  - coverageRatio in [1,2) → 70-100 (enough runway to reorder in time, but
 *                            tightening)
 *  - coverageRatio in [0,1) → 0-70 (will likely stock out before a reorder
 *                            placed today would arrive)
 *  - quantityOnHand === 0  → always 0, no exceptions
 *
 * Falling at or below safety stock caps the score at 50 even if the
 * coverage math looks fine — safety stock exists precisely to absorb
 * demand spikes or supplier delays, so eating into it is a real signal
 * even when the raw days-remaining number isn't alarming yet.
 */
export function computeItemHealthScore(input: HealthScoreInput): number {
  if (input.quantityOnHand <= 0) return 0;

  const leadTimeDays = input.leadTimeDays && input.leadTimeDays > 0 ? input.leadTimeDays : DEFAULT_LEAD_TIME_DAYS;
  const daysRemaining = computeDaysRemaining(input.quantityOnHand, input.avgDailySales);
  // No sales data yet: treat as ample runway (coverageRatio of 3, i.e. a
  // full "100" score band) rather than dividing by a velocity of zero.
  const coverageRatio = daysRemaining === Infinity ? 3 : daysRemaining / leadTimeDays;

  let score: number;
  if (coverageRatio >= 2) score = 100;
  else if (coverageRatio >= 1) score = 70 + (coverageRatio - 1) * 30;
  else score = coverageRatio * 70;

  if (input.quantityOnHand <= input.safetyStock) {
    score = Math.min(score, 50);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function averageHealthScore(scores: number[]): number {
  if (scores.length === 0) return 100;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

export type RecommendationType =
  | "restock_urgent"
  | "restock_soon"
  | "increase_before_demand"
  | "reduce_reorder_quantity"
  | "supplier_lead_time_risk";

export type RecommendationPriority = "low" | "medium" | "high" | "critical";

export interface RecommendationCandidate {
  type: RecommendationType;
  priority: RecommendationPriority;
  message: string;
}

export interface RecommendationInput extends HealthScoreInput {
  productTitle: string;
  supplierName: string | null;
  reorderQuantity: number;
  now?: Date;
}

/**
 * Given one inventory item's current numbers, returns every recommendation
 * that currently applies (an item can have more than one — e.g. both
 * "restock soon" and "reduce reorder quantity" can be true at once for a
 * slow but dwindling product). The reconciliation layer (recommendationService.ts)
 * is responsible for turning "what applies right now" into DB inserts/resolves.
 */
export function generateRecommendationCandidates(input: RecommendationInput): RecommendationCandidate[] {
  const candidates: RecommendationCandidate[] = [];
  const leadTimeDays = input.leadTimeDays && input.leadTimeDays > 0 ? input.leadTimeDays : DEFAULT_LEAD_TIME_DAYS;
  const daysRemaining = computeDaysRemaining(input.quantityOnHand, input.avgDailySales);

  // --- Restock urgency -----------------------------------------------------
  if (input.quantityOnHand <= 0) {
    candidates.push({
      type: "restock_urgent",
      priority: "critical",
      message: `${input.productTitle} is out of stock. Reorder immediately to avoid lost sales.`,
    });
  } else if (daysRemaining !== Infinity && daysRemaining <= leadTimeDays) {
    const daysLeft = Math.max(0, Math.floor(daysRemaining));
    const severe = daysRemaining <= leadTimeDays * 0.5;
    candidates.push({
      type: severe ? "restock_urgent" : "restock_soon",
      priority: severe ? "critical" : "high",
      message: `Restock ${input.productTitle} within ${daysLeft} day${daysLeft === 1 ? "" : "s"} — your supplier's ${leadTimeDays}-day lead time won't beat your sell-through otherwise.`,
    });
  } else if (input.quantityOnHand <= input.safetyStock) {
    candidates.push({
      type: "restock_soon",
      priority: "medium",
      message: `${input.productTitle} has dipped into its safety stock buffer — worth reordering soon.`,
    });
  }

  // --- Slow movers: reorder quantity is oversized for current velocity ---
  if (input.avgDailySales > 0) {
    const daysToSellThroughReorder = input.reorderQuantity / input.avgDailySales;
    if (daysToSellThroughReorder > 60) {
      candidates.push({
        type: "reduce_reorder_quantity",
        priority: "low",
        message: `${input.productTitle}'s reorder quantity would take roughly ${Math.round(daysToSellThroughReorder)} days to sell through at its current pace — consider ordering less per cycle.`,
      });
    }
  }

  // --- Long supplier lead time with thin coverage -------------------------
  const coverageRatio = daysRemaining === Infinity ? 3 : daysRemaining / leadTimeDays;
  if (leadTimeDays > 14 && coverageRatio < 1.5 && input.quantityOnHand > 0) {
    candidates.push({
      type: "supplier_lead_time_risk",
      priority: "medium",
      message: `${input.supplierName ?? "This supplier"}'s ${leadTimeDays}-day lead time leaves little buffer for ${input.productTitle} — consider a backup supplier or a larger safety stock.`,
    });
  }

  // --- Simple weekend-demand heuristic ------------------------------------
  // Honest limitation: there's no historical day-of-week sales breakdown in
  // the schema yet, so this can't be a real seasonality forecast. As a
  // useful-but-modest stand-in, a fast seller (top-tier daily velocity)
  // running low heading into the weekend gets flagged — worth revisiting
  // with real time-series data if this app ever tracks per-day sales.
  const now = input.now ?? new Date();
  const dayOfWeek = now.getDay(); // 0=Sun ... 5=Fri, 6=Sat
  const approachingWeekend = dayOfWeek === 4 || dayOfWeek === 5;
  const isFastSeller = input.avgDailySales >= 3;
  if (approachingWeekend && isFastSeller && daysRemaining !== Infinity && daysRemaining < 10) {
    candidates.push({
      type: "increase_before_demand",
      priority: "low",
      message: `${input.productTitle} sells quickly and the weekend is coming up — consider topping up before demand picks up.`,
    });
  }

  return candidates;
}
