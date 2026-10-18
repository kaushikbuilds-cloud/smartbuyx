"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "./cart-queries";
import { txnidForOrder, isYoupiConfigured } from "@/lib/youpi/client";
import { safeErrorMessage } from "@/lib/utils/safe-error";

export type CreateOrderResult =
  | { ok: true; orderId: string }
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

// Build a DB order from the cart and a "created" payment row. The client then
// navigates to /checkout/pay/[orderId], which opens the YouPI PG UPI checkout.
// YouPI confirms payment via a signed webhook (/api/youpi/webhook), which
// verifies the signature + amount and runs fulfilPaidOrder.
export async function createCheckoutOrder(addressId: string, couponCode?: string): Promise<CreateOrderResult> {
  const { user } = await requireUser();
  if (!isYoupiConfigured()) return { ok: false, error: "Payments are not configured yet." };
  const supabase = await createClient();
  const cart = await getCart(user.id);

  if (cart.lines.length === 0) return { ok: false, error: "Your cart is empty." };

  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();
  if (!profile?.phone) return { ok: false, error: "Add a phone number to your account before checking out." };

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
    // Frozen at purchase time -- a later commission-rate change must never
    // reprice an order already placed. This is what escrow actually pays
    // the seller; the gap vs. `total` is our commission.
    seller_amount: l.sellerUnitPrice * l.quantity,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(items);
  if (itemsErr) return { ok: false, error: itemsErr.message };

  try {
    const { error: paymentErr } = await supabase.from("payments").insert({
      order_id: order.id,
      payu_txnid: txnidForOrder(order.id), // reuses the existing unique txn-id column
      amount: total,
      currency: "INR",
      status: "created",
      raw: { provider: "youpi" },
    });
    if (paymentErr) return { ok: false, error: paymentErr.message };

    return { ok: true, orderId: order.id };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Could not start payment.", "createCheckoutOrder") };
  }
}
