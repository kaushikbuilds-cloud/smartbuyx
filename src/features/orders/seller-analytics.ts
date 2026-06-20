import { createClient } from "@/lib/supabase/server";

export type SellerStats = {
  revenue: number;
  unitsSold: number;
  orderCount: number;
  topProducts: { title: string; units: number; revenue: number }[];
};

// Revenue counts only paid (or further) order lines for this seller.
const COUNTED = ["paid", "processing", "shipped", "delivered"];

export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_items")
    .select("title, quantity, total, order_id, orders!inner(status)")
    .eq("supplier_id", sellerId);

  const rows = (data ?? []).filter((r) => {
    const o = r.orders as unknown as { status: string };
    return COUNTED.includes(o.status);
  });

  const orders = new Set<string>();
  let revenue = 0;
  let unitsSold = 0;
  const byProduct = new Map<string, { units: number; revenue: number }>();

  for (const r of rows) {
    orders.add(r.order_id);
    revenue += Number(r.total);
    unitsSold += r.quantity;
    const cur = byProduct.get(r.title) ?? { units: 0, revenue: 0 };
    cur.units += r.quantity;
    cur.revenue += Number(r.total);
    byProduct.set(r.title, cur);
  }

  const topProducts = [...byProduct.entries()]
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return { revenue, unitsSold, orderCount: orders.size, topProducts };
}
