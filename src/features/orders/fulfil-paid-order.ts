// Deliberately NOT a "use server" file. This performs stock decrement, shipment
// creation, and escrow — with no auth or payment check of its own, trusting
// that the caller already verified payment. If this lived in a "use server"
// file, Next.js would auto-expose it as a client-callable RPC endpoint the
// moment anything imports it into a "use client" component, letting anyone
// flip any pending order to "paid" with just an order id. Keeping it a plain
// module makes that impossible structurally, not just by convention.
//
// Only two callers, both server-only: verifyAndFinalizeOrder (after signature
// verification) and the Razorpay webhook (after signature verification).

import { createAdminClient } from "@/lib/supabase/admin";

// Idempotent fulfilment shared by the client callback and the Razorpay webhook.
// The atomic pending->paid claim guarantees the body runs exactly once, no matter
// which path (or a retry of either) reaches it first — so stock is never
// double-decremented and shipments/escrow are never duplicated. If the client
// callback is missed (tab closed, network drop), the webhook still fulfils.
export async function fulfilPaidOrder(orderId: string): Promise<void> {
  const admin = createAdminClient();

  // Claim the order. Only the caller that flips pending->paid proceeds.
  const { data: claimed } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id, coupon_id, discount, buyer_id");
  if (!claimed || claimed.length === 0) return; // already fulfilled by the other path
  const order = claimed[0];

  await admin.from("order_status_history").insert({ order_id: orderId, status: "paid", note: "Payment captured" });

  // Decrement stock + bump sales per line item.
  const { data: lineItems } = await admin
    .from("order_items")
    .select("variant_id, quantity, product_variants(product_id)")
    .eq("order_id", orderId);
  for (const li of lineItems ?? []) {
    const pv = li.product_variants as unknown as { product_id: string } | null;
    if (pv) {
      await admin.rpc("fulfil_inventory", {
        p_variant: li.variant_id,
        p_qty: li.quantity,
        p_product: pv.product_id,
      });
    }
  }

  // Record coupon redemption (if any) and increment its usage.
  if (order.coupon_id) {
    await admin.from("coupon_redemptions").insert({
      coupon_id: order.coupon_id,
      user_id: order.buyer_id,
      order_id: orderId,
      amount: order.discount,
    });
    await admin.rpc("increment_coupon_use", { p_coupon: order.coupon_id });
  }

  // Create one shipment per distinct seller (delivery partner assigned later).
  const { data: items } = await admin
    .from("order_items")
    .select("id, supplier_id, total")
    .eq("order_id", orderId);

  const sellers = [...new Set((items ?? []).map((i) => i.supplier_id))];
  for (const sellerId of sellers) {
    const { data: shipment } = await admin
      .from("shipments")
      .insert({ order_id: orderId, seller_id: sellerId, status: "pending" })
      .select("id")
      .single();
    if (shipment) {
      const itemIds = (items ?? []).filter((i) => i.supplier_id === sellerId).map((i) => i.id);
      await admin.from("order_items").update({ shipment_id: shipment.id }).in("id", itemIds);
    }

    // ESCROW: hold this seller's portion of the payment until buyer confirms delivery.
    const sellerAmount = (items ?? [])
      .filter((i) => i.supplier_id === sellerId)
      .reduce((sum, i) => sum + Number(i.total), 0);
    await admin.from("escrow_holds").insert({
      order_id: orderId,
      seller_id: sellerId,
      amount: sellerAmount,
      status: "held",
    });
  }

  // Clear the buyer's cart.
  const { data: cart } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", order.buyer_id)
    .single();
  if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);
}
