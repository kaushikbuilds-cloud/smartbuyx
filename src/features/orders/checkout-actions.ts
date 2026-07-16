"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "./cart-queries";
import { razorpay, toPaise } from "@/lib/razorpay/client";
import { verifyPaymentSignature } from "@/lib/razorpay/verify";

export type CreateOrderResult =
  | { ok: true; orderId: string; razorpayOrderId: string; amount: number; keyId: string }
  | { ok: false; error: string };

// Validate a coupon against the current cart. Used by the checkout UI.
export async function validateCoupon(code: string): Promise<{ ok: boolean; discount: number; reason: string }> {
  const { user } = await requireUser();
  if (!code.trim()) return { ok: false, discount: 0, reason: "Enter a code" };
  const supabase = await createClient();
  const cart = await getCart(user.id);
  const { data } = await supabase.rpc("coupon_discount", {
    p_code: code.trim(),
    p_subtotal: cart.subtotal,
    p_user: user.id,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.coupon_id) return { ok: false, discount: 0, reason: row?.reason ?? "Invalid coupon" };
  return { ok: true, discount: Number(row.discount), reason: "ok" };
}

// 1) Build a DB order from the cart, then a Razorpay order to collect payment.
export async function createCheckoutOrder(addressId: string, couponCode?: string): Promise<CreateOrderResult> {
  const { user } = await requireUser();
  const supabase = await createClient();
  const cart = await getCart(user.id);

  if (cart.lines.length === 0) return { ok: false, error: "Your cart is empty." };

  const subtotal = cart.subtotal;
  const tax = 0;
  const shipping = 0;

  // Re-validate coupon server-side (never trust client-supplied discount).
  let discount = 0;
  let couponId: string | null = null;
  if (couponCode?.trim()) {
    const { data } = await supabase.rpc("coupon_discount", {
      p_code: couponCode.trim(),
      p_subtotal: subtotal,
      p_user: user.id,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.coupon_id) {
      discount = Number(row.discount);
      couponId = row.coupon_id;
    }
  }

  const total = Math.max(0, subtotal + tax + shipping - discount);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      shipping_address_id: addressId || null,
      subtotal, tax, shipping, total,
      discount, coupon_id: couponId, coupon_code: couponId ? couponCode!.trim() : null,
      status: "pending",
    })
    .select("id")
    .single();
  if (orderErr) return { ok: false, error: orderErr.message };

  const items = cart.lines.map((l) => ({
    order_id: order.id,
    variant_id: l.variantId,
    supplier_id: l.sellerId,
    title: l.title,
    unit_price: l.unitPrice,
    quantity: l.quantity,
    total: l.unitPrice * l.quantity,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(items);
  if (itemsErr) return { ok: false, error: itemsErr.message };

  try {
    const rzpOrder = await razorpay().orders.create({
      amount: toPaise(total),
      currency: "INR",
      receipt: order.id,
      notes: { order_id: order.id, buyer_id: user.id },
    });

    await supabase.from("payments").insert({
      order_id: order.id,
      razorpay_order_id: rzpOrder.id,
      amount: total,
      currency: "INR",
      status: "created",
    });

    return {
      ok: true,
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: toPaise(total),
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not start payment." };
  }
}

// 2) Verify the Razorpay signature on the client success callback, then fulfil.
export async function verifyAndFinalizeOrder(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireUser();

  const valid = verifyPaymentSignature({
    orderId: input.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  });
  if (!valid) return { ok: false, error: "Payment verification failed." };

  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({
      razorpay_payment_id: input.razorpayPaymentId,
      razorpay_signature: input.razorpaySignature,
      status: "captured",
    })
    .eq("razorpay_order_id", input.razorpayOrderId);

  await fulfilPaidOrder(input.orderId);
  revalidatePath("/orders");
  return { ok: true };
}

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
