"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "./cart-queries";
import { razorpay, toPaise } from "@/lib/razorpay/client";
import { verifyPaymentSignature } from "@/lib/razorpay/verify";
import { fulfilPaidOrder } from "./fulfil-paid-order";

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

// fulfilPaidOrder now lives in ./fulfil-paid-order.ts (deliberately not a
// "use server" file — see the comment there for why).
