import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type RiskLevel = "low" | "medium" | "high";

export type BuyerRisk = {
  score: number; // 0-100, higher = riskier
  level: RiskLevel;
  signals: string[];
};

// Reasons that suggest return abuse rather than a genuine product issue.
const ABUSE_REASONS = new Set(["better_price", "no_longer_needed"]);

// Behavioral fraud scoring from a buyer's own history. Deterministic — works
// with or without the AI key. Higher score = higher return/refund abuse risk.
export async function computeBuyerRisk(buyerId: string): Promise<BuyerRisk> {
  if (!isSupabaseConfigured()) return { score: 0, level: "low", signals: [] };
  const supabase = await createClient();

  const [ordersRes, returnsRes, profileRes] = await Promise.all([
    supabase.from("orders").select("id, status").eq("buyer_id", buyerId),
    supabase.from("return_requests").select("id, reason, status, amount").eq("user_id", buyerId),
    supabase.from("profiles").select("created_at").eq("id", buyerId).single(),
  ]);

  const orders = ordersRes.data ?? [];
  const returns = returnsRes.data ?? [];
  const totalOrders = orders.length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const refundedReturns = returns.filter((r) => r.status === "refunded").length;
  const abuseReturns = returns.filter((r) => ABUSE_REASONS.has(r.reason as string)).length;

  const signals: string[] = [];
  let score = 0;

  // 1) Return rate (up to 35)
  const returnRate = totalOrders > 0 ? returns.length / totalOrders : 0;
  if (returnRate > 0) {
    const pts = Math.min(35, Math.round(returnRate * 50));
    score += pts;
    if (returnRate >= 0.4) signals.push(`High return rate (${Math.round(returnRate * 100)}%)`);
  }

  // 2) Abuse-reason returns (up to 25)
  if (abuseReturns > 0) {
    score += Math.min(25, abuseReturns * 8);
    signals.push(`${abuseReturns} return(s) for "better price"/"no longer needed"`);
  }

  // 3) Cancellation rate (up to 15)
  const cancelRate = totalOrders > 0 ? cancelled / totalOrders : 0;
  if (cancelRate >= 0.3 && cancelled >= 2) {
    score += 15;
    signals.push(`Frequent cancellations (${cancelled})`);
  }

  // 4) Many refunds (up to 15)
  if (refundedReturns >= 3) {
    score += 15;
    signals.push(`${refundedReturns} refunds issued`);
  }

  // 5) Brand-new account with immediate return (up to 10)
  const createdAt = profileRes.data?.created_at ? new Date(profileRes.data.created_at) : null;
  const ageDays = createdAt ? (Date.now() - createdAt.getTime()) / 86400000 : 999;
  if (ageDays < 3 && returns.length > 0) {
    score += 10;
    signals.push("New account with early return");
  }

  score = Math.min(100, score);
  const level: RiskLevel = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, signals };
}

// Batch helper — de-dupes buyer lookups for a list of buyer ids.
export async function computeBuyerRisks(buyerIds: string[]): Promise<Map<string, BuyerRisk>> {
  const unique = [...new Set(buyerIds)];
  const entries = await Promise.all(unique.map(async (id) => [id, await computeBuyerRisk(id)] as const));
  return new Map(entries);
}
