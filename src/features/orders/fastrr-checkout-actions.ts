"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "./cart-queries";
import { generateAccessToken, isFastrrConfigured } from "@/lib/fastrr/client";
import { safeErrorMessage } from "@/lib/utils/safe-error";

export type FastrrCheckoutResult = { ok: true; token: string } | { ok: false; error: string };

// Replaces createCheckoutOrder (PayU) as the active checkout path. Unlike
// PayU, no `orders` row is created here -- Fastrr owns the checkout UI and
// only tells us about the order after it's placed (see order-webhook route),
// so this just stages a session (cart/coupon/address snapshot) to be matched
// against that later, and hands back the token that drives Fastrr's iframe.
export async function startFastrrCheckout(addressId: string, couponCode?: string): Promise<FastrrCheckoutResult> {
  const { user } = await requireUser();
  if (!isFastrrConfigured()) return { ok: false, error: "Checkout is not configured yet." };
  const supabase = await createClient();
  const cart = await getCart(user.id);
  if (cart.lines.length === 0) return { ok: false, error: "Your cart is empty." };
  if (!addressId) return { ok: false, error: "Please add a delivery address." };

  const subtotal = cart.subtotal;

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
  const total = Math.max(0, subtotal - discount);

  const admin = createAdminClient();
  const { data: session, error: sessionErr } = await admin
    .from("fastrr_checkout_sessions")
    .insert({
      user_id: user.id,
      address_id: addressId,
      coupon_id: couponId,
      coupon_code: couponId ? couponCode!.trim() : null,
      discount,
      subtotal,
      total,
      cart_snapshot: cart.lines.map((l) => ({
        variant_id: l.variantId,
        product_id: l.productId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        title: l.title,
        supplier_id: l.sellerId,
      })),
      status: "initiated",
    })
    .select("id")
    .single();
  if (sessionErr || !session) return { ok: false, error: sessionErr?.message ?? "Could not start checkout." };

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const { token } = await generateAccessToken(
      cart.lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
      `${appUrl}/checkout/fastrr-return?ref=${session.id}`
    );
    return { ok: true, token };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Could not start checkout.", "startFastrrCheckout") };
  }
}
