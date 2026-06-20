import { createClient } from "@/lib/supabase/server";

export type OrderSummary = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  itemCount: number;
  firstTitle: string;
};

export type OrderItem = {
  id: string;
  variant_id: string;
  title: string;
  unit_price: number;
  quantity: number;
  total: number;
  supplier_id: string;
  shipment_id: string | null;
};

export type OrderDetail = {
  id: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  history: { status: string; note: string | null; created_at: string }[];
};

export async function listOrders(userId: string): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, total, status, created_at, order_items(title)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((o) => {
    const items = (o.order_items ?? []) as { title: string }[];
    return {
      id: o.id,
      total: Number(o.total),
      status: o.status,
      created_at: o.created_at,
      itemCount: items.length,
      firstTitle: items[0]?.title ?? "Order",
    };
  });
}

export async function getOrder(userId: string, orderId: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, subtotal, tax, shipping, discount, total, status, created_at, buyer_id")
    .eq("id", orderId)
    .single();
  if (!order || order.buyer_id !== userId) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, variant_id, title, unit_price, quantity, total, supplier_id, shipment_id")
    .eq("order_id", orderId);

  const { data: history } = await supabase
    .from("order_status_history")
    .select("status, note, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return {
    id: order.id,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shipping: Number(order.shipping),
    discount: Number(order.discount ?? 0),
    total: Number(order.total),
    status: order.status,
    created_at: order.created_at,
    items: (items ?? []).map((i) => ({ ...i, unit_price: Number(i.unit_price), total: Number(i.total) })) as OrderItem[],
    history: (history ?? []) as OrderDetail["history"],
  };
}
