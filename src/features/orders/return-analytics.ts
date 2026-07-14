import { createClient } from "@/lib/supabase/server";

export type ReturnStat = {
  title: string;
  returns: number;
  refundedAmount: number;
};

export type SellerReturnStats = {
  totalReturns: number;
  refundedAmount: number;
  topReturned: ReturnStat[];
};

// Returns analytics for a seller: which of their products get returned most.
// return_requests -> order_items (filtered to this seller's items).
export async function getSellerReturnStats(sellerId: string): Promise<SellerReturnStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("return_requests")
    .select("amount, status, order_items!inner(title, supplier_id)")
    .eq("order_items.supplier_id", sellerId);

  const byTitle = new Map<string, ReturnStat>();
  let totalReturns = 0;
  let refundedAmount = 0;

  for (const r of data ?? []) {
    const item = r.order_items as unknown as { title: string };
    const title = item?.title ?? "Item";
    totalReturns += 1;
    const amt = Number(r.amount);
    if (r.status === "refunded") refundedAmount += amt;

    const existing = byTitle.get(title) ?? { title, returns: 0, refundedAmount: 0 };
    existing.returns += 1;
    if (r.status === "refunded") existing.refundedAmount += amt;
    byTitle.set(title, existing);
  }

  const topReturned = [...byTitle.values()].sort((a, b) => b.returns - a.returns).slice(0, 5);
  return { totalReturns, refundedAmount, topReturned };
}
