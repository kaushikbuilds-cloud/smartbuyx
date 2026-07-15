import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type InventoryInsight = {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  unitsSoldLast30d: number;
  dailyVelocity: number;
  daysUntilStockout: number | null; // null = no recent sales, can't predict
  forecastNext30d: number; // predicted units to sell in next 30 days
  suggestedReorderQty: number;
  status: "critical" | "low" | "healthy" | "no_sales";
};

const LOOKBACK_DAYS = 30;
const REORDER_COVER_DAYS = 21; // reorder enough to cover 3 weeks of predicted demand

// Smart Inventory Alerts + Sales Forecasting.
// Velocity = units sold / lookback window. Forecast = velocity * 30 (naive but honest).
// Reorder suggestion = enough stock to cover REORDER_COVER_DAYS of predicted demand.
export async function getInventoryIntelligence(sellerId: string): Promise<InventoryInsight[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, sku, product_id, products!inner(title, supplier_id), inventory(quantity)")
    .eq("products.supplier_id", sellerId);

  if (!variants || variants.length === 0) return [];

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();
  const variantIds = variants.map((v) => v.id);

  // Units sold per variant in the lookback window, from paid+ orders.
  const { data: soldRows } = await supabase
    .from("order_items")
    .select("variant_id, quantity, orders!inner(status, created_at)")
    .in("variant_id", variantIds)
    .gte("orders.created_at", since)
    .in("orders.status", ["paid", "processing", "shipped", "delivered"]);

  const soldByVariant = new Map<string, number>();
  for (const row of soldRows ?? []) {
    soldByVariant.set(row.variant_id, (soldByVariant.get(row.variant_id) ?? 0) + row.quantity);
  }

  return variants.map((v) => {
    const product = v.products as unknown as { title: string };
    const inv = v.inventory as unknown as { quantity: number } | { quantity: number }[] | null;
    const quantity = Array.isArray(inv) ? (inv[0]?.quantity ?? 0) : (inv?.quantity ?? 0);
    const sold = soldByVariant.get(v.id) ?? 0;
    const velocity = sold / LOOKBACK_DAYS;
    const daysLeft = velocity > 0 ? Math.round(quantity / velocity) : null;
    const forecast = Math.round(velocity * 30);
    const targetStock = Math.ceil(velocity * REORDER_COVER_DAYS);
    const reorderQty = Math.max(0, targetStock - quantity);

    let status: InventoryInsight["status"] = "healthy";
    if (sold === 0) status = "no_sales";
    else if (daysLeft !== null && daysLeft <= 7) status = "critical";
    else if (daysLeft !== null && daysLeft <= 14) status = "low";

    return {
      variantId: v.id,
      productId: v.product_id,
      title: product.title,
      sku: v.sku,
      quantity,
      unitsSoldLast30d: sold,
      dailyVelocity: Math.round(velocity * 100) / 100,
      daysUntilStockout: daysLeft,
      forecastNext30d: forecast,
      suggestedReorderQty: reorderQty,
      status,
    };
  }).sort((a, b) => {
    const order = { critical: 0, low: 1, healthy: 2, no_sales: 3 };
    return order[a.status] - order[b.status];
  });
}
