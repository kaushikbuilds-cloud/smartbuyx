import { createAdminClient } from "@/lib/supabase/admin";

export type ReturnStat = {
  title: string;
  returns: number;
  refundedAmount: number;
};

export type SellerReturnStats = {
  totalReturns: number;
  refundedAmount: number;
  disputedCount: number;
  returnScore: number; // 0-100, higher is better (fewer/cleaner returns)
  topReturned: ReturnStat[];
};

// Returns analytics for a seller: which of their products get returned most.
// return_requests -> order_items (filtered to this seller's items). RLS on
// return_requests only grants buyers their own rows, so this needs the admin
// client — sellerId always comes from the authenticated session, never input.
export async function getSellerReturnStats(sellerId: string, orderCount = 0): Promise<SellerReturnStats> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("return_requests")
    .select("amount, status, disputed, order_items!inner(title, supplier_id)")
    .eq("order_items.supplier_id", sellerId);

  const byTitle = new Map<string, ReturnStat>();
  let totalReturns = 0;
  let refundedAmount = 0;
  let disputedCount = 0;

  for (const r of data ?? []) {
    const item = r.order_items as unknown as { title: string };
    const title = item?.title ?? "Item";
    totalReturns += 1;
    if (r.disputed) disputedCount += 1;
    const amt = Number(r.amount);
    if (r.status === "refunded") refundedAmount += amt;

    const existing = byTitle.get(title) ?? { title, returns: 0, refundedAmount: 0 };
    existing.returns += 1;
    if (r.status === "refunded") existing.refundedAmount += amt;
    byTitle.set(title, existing);
  }

  const topReturned = [...byTitle.values()].sort((a, b) => b.returns - a.returns).slice(0, 5);
  const returnRate = orderCount > 0 ? totalReturns / orderCount : 0;
  const returnScore = Math.max(0, Math.min(100, Math.round(100 - returnRate * 200 - disputedCount * 5)));
  return { totalReturns, refundedAmount, disputedCount, returnScore, topReturned };
}
