"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "./cart-queries";
import { generatePayuRequestHash, payuBaseUrl, txnidForOrder, isPayuConfigured } from "@/lib/payu/client";
import { safeErrorMessage } from "@/lib/utils/safe-error";

export type CreateOrderResult =
  | {
      ok: true;
      payuUrl: string;
      fields: {
        key: string; txnid: string; amount: string; productinfo: string;
        firstname: string; email: string; phone: string; surl: string; furl: string; hash: string;
      };
    }
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

// Build a DB order from the cart, then a PayU hosted-checkout form the
// client auto-submits (browser navigates to PayU's payment page; there is
// no client-side widget/SDK for this flow). PayU posts the result back to
// /api/payu/callback (see that route for hash verification + fulfilment).
export async function createCheckoutOrder(addressId: string, couponCode?: string): Promise<CreateOrderResult> {
  const { user } = await requireUser();
  if (!isPayuConfigured()) return { ok: false, error: "Payments are not configured yet." };
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
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(items);
  if (itemsErr) return { ok: false, error: itemsErr.message };

  try {
    const key = process.env.PAYU_MERCHANT_KEY!;
    const txnid = txnidForOrder(order.id);
    const amount = total.toFixed(2); // must be byte-identical everywhere it's used (hash + form + response)
    const productinfo = "SmartBuyX Order";
    const firstname = (profile.full_name ?? user.email ?? "Customer").split(" ")[0];
    const email = user.email ?? "";
    const phone = profile.phone;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const surl = `${appUrl}/api/payu/callback`;
    const furl = `${appUrl}/api/payu/callback`; // same route -- it reads `status` from the posted body

    const hash = generatePayuRequestHash({ key, txnid, amount, productinfo, firstname, email });

    const { error: paymentErr } = await supabase.from("payments").insert({
      order_id: order.id,
      payu_txnid: txnid,
      amount: total,
      currency: "INR",
      status: "created",
    });
    if (paymentErr) return { ok: false, error: paymentErr.message };

    return {
      ok: true,
      payuUrl: payuBaseUrl(),
      fields: { key, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash },
    };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Could not start payment.", "createCheckoutOrder") };
  }
}
