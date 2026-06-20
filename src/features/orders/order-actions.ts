"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/guards";

const CANCELLABLE = ["pending", "paid", "processing"];

export async function cancelOrder(orderId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, status, total")
    .eq("id", orderId)
    .single();
  if (!order || order.buyer_id !== user.id) return { ok: false, error: "Order not found." };
  if (!CANCELLABLE.includes(order.status)) {
    return { ok: false, error: "This order can no longer be cancelled." };
  }

  const admin = createAdminClient();
  const wasPaid = order.status !== "pending";

  await admin
    .from("orders")
    .update({ status: "cancelled", cancelled_reason: reason || null, cancelled_at: new Date().toISOString() })
    .eq("id", orderId);
  await admin.from("order_status_history").insert({ order_id: orderId, status: "cancelled", note: reason || null });
  await admin.from("shipments").update({ status: "cancelled" }).eq("order_id", orderId);

  // Restore stock for each line.
  const { data: items } = await admin.from("order_items").select("variant_id, quantity").eq("order_id", orderId);
  for (const it of items ?? []) {
    const { data: inv } = await admin.from("inventory").select("quantity").eq("variant_id", it.variant_id).single();
    if (inv) await admin.from("inventory").update({ quantity: inv.quantity + it.quantity }).eq("variant_id", it.variant_id);
  }

  // Refund paid amount to the in-app wallet + mark held escrow as refunded (not released).
  if (wasPaid) {
    await admin.rpc("credit_wallet", {
      p_user: user.id,
      p_amount: Number(order.total),
      p_kind: "refund",
      p_reference: orderId,
    });
    await admin.from("payments").update({ status: "refunded" }).eq("order_id", orderId);
    await admin.from("escrow_holds").update({ status: "refunded" }).eq("order_id", orderId).eq("status", "held");
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true };
}

// Buyer confirms a delivered shipment — releases the seller's escrow into their wallet.
export async function confirmDelivery(shipmentId: string): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, order_id, seller_id, status, orders!inner(buyer_id)")
    .eq("id", shipmentId)
    .single();
  if (!shipment) return { ok: false, error: "Shipment not found." };
  const order = shipment.orders as unknown as { buyer_id: string };
  if (order.buyer_id !== user.id) return { ok: false, error: "Not your order." };
  if (shipment.status !== "delivered") return { ok: false, error: "Not yet delivered." };

  const admin = createAdminClient();
  await admin.rpc("release_escrow", { p_order: shipment.order_id, p_seller: shipment.seller_id });

  revalidatePath(`/orders/${shipment.order_id}`);
  return { ok: true };
}
