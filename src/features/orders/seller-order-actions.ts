"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { isWhatsAppConfigured, sendWhatsAppTemplate } from "@/lib/whatsapp/client";

const SELLER_ROLES = ["supplier", "d2c_brand", "admin", "superadmin"] as const;

// Allowed seller-driven shipment transitions.
const NEXT: Record<string, string[]> = {
  pending: ["ready_to_ship", "cancelled"],
  ready_to_ship: ["picked_up", "cancelled"],
  picked_up: ["in_transit"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
};

const SHIPPED_STATES = ["ready_to_ship", "picked_up", "in_transit", "out_for_delivery"];

export async function updateShipmentStatus(
  shipmentId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireRole(...SELLER_ROLES);
  const supabase = await createClient();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, order_id, status, seller_id")
    .eq("id", shipmentId)
    .single();
  if (!shipment || shipment.seller_id !== user.id) return { ok: false, error: "Not found." };

  const allowed = NEXT[shipment.status] ?? [];
  if (!allowed.includes(status)) return { ok: false, error: `Cannot move from ${shipment.status} to ${status}.` };

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (SHIPPED_STATES.includes(status) && status === "ready_to_ship") patch.shipped_at = new Date().toISOString();
  if (status === "delivered") patch.delivered_at = new Date().toISOString();

  await supabase.from("shipments").update(patch).eq("id", shipmentId);

  // Recompute the parent order status from all its shipments.
  await syncOrderStatus(shipment.order_id);

  revalidatePath("/dashboard/supplier/orders");
  revalidatePath(`/orders/${shipment.order_id}`);
  return { ok: true };
}

async function syncOrderStatus(orderId: string) {
  const admin = createAdminClient();
  const { data: shipments } = await admin.from("shipments").select("status").eq("order_id", orderId);
  const statuses = (shipments ?? []).map((s) => s.status);
  if (statuses.length === 0) return;

  let orderStatus: string;
  if (statuses.every((s) => s === "delivered")) orderStatus = "delivered";
  else if (statuses.some((s) => SHIPPED_STATES.includes(s) || s === "delivered")) orderStatus = "shipped";
  else orderStatus = "processing";

  const { data: current } = await admin.from("orders").select("status").eq("id", orderId).single();
  if (current?.status !== orderStatus) {
    await admin.from("orders").update({ status: orderStatus }).eq("id", orderId);
    await admin.from("order_status_history").insert({ order_id: orderId, status: orderStatus });
    if (orderStatus === "shipped" || orderStatus === "delivered") {
      await notifyBuyerWhatsApp(orderId, orderStatus);
    }
  }
}

// Best-effort WhatsApp ping for opted-in buyers — never blocks the status update.
async function notifyBuyerWhatsApp(orderId: string, status: "shipped" | "delivered") {
  if (!isWhatsAppConfigured()) return;
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("buyer_id").eq("id", orderId).single();
  if (!order) return;
  const { data: profile } = await admin
    .from("profiles")
    .select("phone, preferences")
    .eq("id", order.buyer_id)
    .single();
  const prefs = profile?.preferences as { notifications?: { whatsapp?: boolean } } | null;
  if (!prefs?.notifications?.whatsapp || !profile?.phone) return;

  const template = status === "shipped" ? "order_shipped" : "order_delivered";
  await sendWhatsAppTemplate(profile.phone, template, [orderId.slice(0, 8).toUpperCase()]);
}
