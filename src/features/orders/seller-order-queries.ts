import { createClient } from "@/lib/supabase/server";

export type SellerOrderLine = {
  shipmentId: string | null;
  orderId: string;
  status: string;
  placedAt: string;
  items: { title: string; quantity: number; total: number }[];
  amount: number;
};

export async function getSellerOrders(sellerId: string): Promise<SellerOrderLine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_items")
    .select("order_id, shipment_id, title, quantity, total, orders!inner(created_at), shipments(status)")
    .eq("supplier_id", sellerId)
    .order("order_id", { ascending: false });

  const byShipment = new Map<string, SellerOrderLine>();
  for (const row of data ?? []) {
    const key = row.shipment_id ?? row.order_id;
    const order = row.orders as unknown as { created_at: string };
    const shipment = row.shipments as unknown as { status: string } | null;
    if (!byShipment.has(key)) {
      byShipment.set(key, {
        shipmentId: row.shipment_id,
        orderId: row.order_id,
        status: shipment?.status ?? "pending",
        placedAt: order.created_at,
        items: [],
        amount: 0,
      });
    }
    const line = byShipment.get(key)!;
    line.items.push({ title: row.title, quantity: row.quantity, total: Number(row.total) });
    line.amount += Number(row.total);
  }

  return [...byShipment.values()].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}
