import { createClient } from "@/lib/supabase/server";

export type PriceTrend = {
  current: number;
  trend: "up" | "down" | "flat" | "new"; // "new" = not enough history yet
  changePercent: number | null;
  isLowestRecorded: boolean;
  pointCount: number;
};

// Honest trend-so-far reading from accumulated price_history rows -- NOT a
// forecast/prediction. Meaningful predictions need weeks/months of data;
// this is the foundation for that, usable today as "up/down since 30 days
// ago" and "lowest we've ever tracked it at."
export async function getPriceTrend(productId: string, currentPrice: number): Promise<PriceTrend> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("product_id", productId)
    .order("recorded_at", { ascending: false })
    .limit(60);

  const rows = data ?? [];
  if (rows.length < 2) {
    return { current: currentPrice, trend: "new", changePercent: null, isLowestRecorded: rows.length > 0, pointCount: rows.length };
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const baseline = rows.find((r) => new Date(r.recorded_at).getTime() <= thirtyDaysAgo) ?? rows[rows.length - 1];
  const changePercent = baseline.price > 0 ? ((currentPrice - Number(baseline.price)) / Number(baseline.price)) * 100 : 0;
  const trend: PriceTrend["trend"] = Math.abs(changePercent) < 1 ? "flat" : changePercent > 0 ? "up" : "down";
  const lowest = Math.min(...rows.map((r) => Number(r.price)));

  return {
    current: currentPrice,
    trend,
    changePercent: Math.round(changePercent),
    isLowestRecorded: currentPrice <= lowest,
    pointCount: rows.length,
  };
}
