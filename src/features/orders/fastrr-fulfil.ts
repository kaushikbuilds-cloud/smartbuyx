// Fastrr counterpart to fulfil-paid-order.ts. Structurally different because
// Fastrr owns checkout entirely: there's no pre-existing "pending" order to
// flip to "paid" the way PayU's flow works -- the order is created here,
// already paid, once Fastrr's webhook (re-confirmed via fetchOrderDetails)
// tells us it happened. Not "use server" for the same reason as
// fulfil-paid-order.ts: no auth check of its own, must not be client-callable.
import { createAdminClient } from "@/lib/supabase/admin";
import { createShiprocketShipment } from "@/features/shipping/create-shipment";
import type { FastrrOrderDetails } from "@/lib/fastrr/client";

export type FulfilResult = { ok: true; orderId: string } | { ok: false; reason: string };

// Fastrr's order webhook carries no reference to which of our users placed
// the order (see the integration guide -- payload is order_id, cart_data,
// status, phone, email, payment_type, total_amount_payable only). Matched
// here via phone number against this buyer's own recent "initiated" checkout
// session, since that's the only reliable link available. Needs verifying
// against a real test order -- if phone numbers ever collide or a session is
// matched incorrectly, that's the first place to look.
export async function fulfillFastrrOrder(order: FastrrOrderDetails): Promise<FulfilResult> {
  const admin = createAdminClient();

  const { data: existing } = await admin.from("orders").select("id").eq("fastrr_order_id", order.order_id).maybeSingle();
  if (existing) return { ok: true, orderId: existing.id }; // already processed -- idempotent

  const { data: profile } = await admin.from("profiles").select("id").eq("phone", order.phone).maybeSingle();
  if (!profile) return { ok: false, reason: `No profile matches phone ${order.phone}` };

  const { data: sessions } = await admin
    .from("fastrr_checkout_sessions")
    .select("id, address_id, coupon_id, discount, subtotal, total, cart_snapshot")
    .eq("user_id", profile.id)
    .eq("status", "initiated")
    .order("created_at", { ascending: false })
    .limit(5);

  const session = (sessions ?? []).find((s) => Math.abs(Number(s.total) - order.total_amount_payable) < 5);
  if (!session) return { ok: false, reason: `No matching checkout session for user ${profile.id}, amount ${order.total_amount_payable}` };

  const cartSnapshot = session.cart_snapshot as { variant_id: string; product_id: string; quantity: number; unit_price: number; title: string; supplier_id: string }[];

  const { data: newOrder, error: orderErr } = await admin
    .from("orders")
    .insert({
      buyer_id: profile.id,
      shipping_address_id: session.address_id,
      subtotal: session.subtotal,
      tax: 0,
      shipping: 0,
      discount: session.discount,
      coupon_id: session.coupon_id,
      total: session.total,
      status: "paid",
      fastrr_order_id: order.order_id,
      session_ref: session.id,
    })
    .select("id")
    .single();
  if (orderErr || !newOrder) return { ok: false, reason: orderErr?.message ?? "Order insert failed" };

  const items = cartSnapshot.map((l) => ({
    order_id: newOrder.id,
    variant_id: l.variant_id,
    supplier_id: l.supplier_id,
    title: l.title,
    unit_price: l.unit_price,
    quantity: l.quantity,
    total: l.unit_price * l.quantity,
  }));
  await admin.from("order_items").insert(items);
  await admin.from("order_status_history").insert({ order_id: newOrder.id, status: "paid", note: "Payment captured via Fastrr" });
  await admin.from("fastrr_checkout_sessions").update({ status: "completed", fastrr_order_id: order.order_id }).eq("id", session.id);

  for (const l of cartSnapshot) {
    await admin.rpc("fulfil_inventory", { p_variant: l.variant_id, p_qty: l.quantity, p_product: l.product_id });
  }

  if (session.coupon_id) {
    await admin.from("coupon_redemptions").insert({
      coupon_id: session.coupon_id, user_id: profile.id, order_id: newOrder.id, amount: session.discount,
    });
    await admin.rpc("increment_coupon_use", { p_coupon: session.coupon_id });
  }

  const sellers = [...new Set(cartSnapshot.map((l) => l.supplier_id))];
  for (const sellerId of sellers) {
    const { data: shipment } = await admin
      .from("shipments")
      .insert({ order_id: newOrder.id, seller_id: sellerId, status: "pending" })
      .select("id")
      .single();
    if (shipment) {
      const { data: theseItems } = await admin.from("order_items").select("id").eq("order_id", newOrder.id).eq("supplier_id", sellerId);
      await admin.from("order_items").update({ shipment_id: shipment.id }).in("id", (theseItems ?? []).map((i) => i.id));
      await createShiprocketShipment(shipment.id);
    }

    const sellerAmount = cartSnapshot.filter((l) => l.supplier_id === sellerId).reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    await admin.from("escrow_holds").insert({ order_id: newOrder.id, seller_id: sellerId, amount: sellerAmount, status: "held" });
  }

  const { data: cart } = await admin.from("carts").select("id").eq("user_id", profile.id).single();
  if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);

  return { ok: true, orderId: newOrder.id };
}
