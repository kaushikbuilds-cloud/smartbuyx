import { createClient } from "@/lib/supabase/server";

export type SellerOrderLine = {
  shipmentId: string | null;
  orderId: string;
  buyerId: string;
  status: string;
  placedAt: string;
  items: { title: string; quantity: number; total: number }[];
  amount: number;
  awb: string | null;
  courierName: string | null;
  labelUrl: string | null;
  bookingError: string | null;
};

export async function getSellerOrders(sellerId: string): Promise<SellerOrderLine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_items")
    .select("order_id, shipment_id, title, quantity, total, orders!inner(created_at, buyer_id), shipments(status, awb, courier_name, label_url, raw)")
    .eq("supplier_id", sellerId)
    .order("order_id", { ascending: false });

  const byShipment = new Map<string, SellerOrderLine>();
  for (const row of data ?? []) {
    const key = row.shipment_id ?? row.order_id;
    const order = row.orders as unknown as { created_at: string; buyer_id: string };
    const shipment = row.shipments as unknown as { status: string; awb: string | null; courier_name: string | null; label_url: string | null; raw: { error?: string } | null } | null;
    if (!byShipment.has(key)) {
      byShipment.set(key, {
        shipmentId: row.shipment_id,
        orderId: row.order_id,
        buyerId: order.buyer_id,
        status: shipment?.status ?? "pending",
        placedAt: order.created_at,
        items: [],
        amount: 0,
        awb: shipment?.awb ?? null,
        courierName: shipment?.courier_name ?? null,
        labelUrl: shipment?.label_url ?? null,
        bookingError: shipment?.raw?.error ?? null,
      });
    }
    const line = byShipment.get(key)!;
    line.items.push({ title: row.title, quantity: row.quantity, total: Number(row.total) });
    line.amount += Number(row.total);
  }

  return [...byShipment.values()].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}
