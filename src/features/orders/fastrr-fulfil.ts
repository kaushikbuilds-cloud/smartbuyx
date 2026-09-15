// Fastrr counterpart to fulfil-paid-order.ts. Structurally different because
// Fastrr owns checkout entirely: there's no pre-existing "pending" order to
// flip to "paid" the way PayU's flow works -- the order is created here,
// already paid, once Fastrr's webhook tells us it happened. Not "use server"
// for the same reason as fulfil-paid-order.ts: no auth check of its own,
// must not be client-callable.
//
// IMPORTANT: the real production webhook payload (confirmed via live
// runtime logs) does NOT match the integration guide's documented example.
// The guide showed {order_id, cart_data, status, phone, email,
// payment_type, total_amount_payable}; the actual payload Fastrr sends is
// {cart_id, latest_stage, items[], total_price, total_discount,
// billing_address, shipping_address, ...} -- no order_id, no email, no
// top-level phone/status. This type reflects what's actually received.
import { createAdminClient } from "@/lib/supabase/admin";
import { createShiprocketShipment } from "@/features/shipping/create-shipment";

export type FastrrWebhookAddress = {
  name: string;
  first_name?: string;
  last_name?: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  country?: string;
};

export type FastrrWebhookItem = {
  product_id: number;
  variant_id: number;
  title: string;
  name: string;
  price: number;
  quantity: number;
};

export type FastrrWebhookPayload = {
  cart_id: string;
  latest_stage: string;
  items: FastrrWebhookItem[];
  total_price: number;
  shipping_price?: number;
  total_discount?: number;
  tax?: number;
  billing_address: FastrrWebhookAddress;
  shipping_address?: FastrrWebhookAddress;
};

export type FulfilResult = { ok: true; orderId: string } | { ok: false; reason: string };

export async function fulfillFastrrOrder(payload: FastrrWebhookPayload): Promise<FulfilResult> {
  const admin = createAdminClient();

  const { data: existing } = await admin.from("orders").select("id").eq("fastrr_order_id", payload.cart_id).maybeSingle();
  if (existing) return { ok: true, orderId: existing.id }; // already processed -- idempotent

  const address = payload.shipping_address ?? payload.billing_address;
  const phone = address.phone;
  const { data: profile } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (!profile) return { ok: false, reason: `No profile matches phone ${phone}` };

  // Items carry the numeric ids we handed Fastrr at checkout (see
  // fastrr-checkout-actions.ts) -- resolve them back to real variant rows
  // rather than trusting title/price from the webhook body.
  const numericIds = payload.items.map((i) => i.variant_id);
  const { data: variantRows } = await admin
    .from("product_variants")
    .select("id, fastrr_numeric_id, price, product_id, products(title, supplier_id)")
    .in("fastrr_numeric_id", numericIds);

  const variantByNumericId = new Map((variantRows ?? []).map((v) => [v.fastrr_numeric_id, v]));
  const resolvedItems: { variant_id: string; product_id: string; supplier_id: string; title: string; unit_price: number; quantity: number }[] = [];
  for (const item of payload.items) {
    const variant = variantByNumericId.get(item.variant_id);
    if (!variant) return { ok: false, reason: `No variant matches Fastrr numeric id ${item.variant_id}` };
    const product = variant.products as unknown as { title: string; supplier_id: string };
    resolvedItems.push({
      variant_id: variant.id,
      product_id: variant.product_id,
      supplier_id: product.supplier_id,
      title: product.title,
      unit_price: Number(variant.price),
      quantity: item.quantity,
    });
  }

  const { data: newAddress, error: addressErr } = await admin
    .from("addresses")
    .insert({
      user_id: profile.id,
      label: "Fastrr checkout",
      line1: address.address1,
      line2: address.address2 || null,
      city: address.city,
      state: address.city, // Fastrr's payload has no separate state field
      pincode: address.zip,
      country: "IN",
    })
    .select("id")
    .single();
  // Not fatal -- the order can still be created with a null shipping
  // address and fixed up manually -- but a silent failure here previously
  // meant a "paid" order with no shipping address and no record of why.
  if (addressErr) console.error("[fastrr-fulfil] address insert failed", { message: addressErr.message, cartId: payload.cart_id });

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const discount = Number(payload.total_discount ?? 0);
  const shipping = Number(payload.shipping_price ?? 0);
  const tax = Number(payload.tax ?? 0);
  const total = Number(payload.total_price);

  // This webhook has no signature/HMAC (see file header) -- its total_price
  // is otherwise-unauthenticated attacker input, and would otherwise flow
  // straight into orders.total and per-seller escrow amounts below. Reject
  // anything that doesn't match what our own catalog prices compute to
  // (small tolerance for rounding), rather than trusting a claimed total we
  // can't verify against Fastrr's own records.
  const expectedTotal = subtotal - discount + shipping + tax;
  if (Math.abs(expectedTotal - total) > 1) {
    return { ok: false, reason: `total_price ${total} doesn't match computed total ${expectedTotal} (subtotal ${subtotal}, discount ${discount}, shipping ${shipping}, tax ${tax})` };
  }

  const { data: newOrder, error: orderErr } = await admin
    .from("orders")
    .insert({
      buyer_id: profile.id,
      shipping_address_id: newAddress?.id ?? null,
      subtotal, tax, shipping, discount,
      total,
      status: "paid",
      fastrr_order_id: payload.cart_id,
    })
    .select("id")
    .single();
  if (orderErr || !newOrder) return { ok: false, reason: orderErr?.message ?? "Order insert failed" };

  const items = resolvedItems.map((l) => ({
    order_id: newOrder.id,
    variant_id: l.variant_id,
    supplier_id: l.supplier_id,
    title: l.title,
    unit_price: l.unit_price,
    quantity: l.quantity,
    total: l.unit_price * l.quantity,
  }));
  // A failure here would otherwise leave a "paid" order with $0 of line
  // items and no record of why -- the same silent-empty-result bug class
  // this codebase has hit before (see PayU/Fastrr-catalog history).
  const { error: itemsErr } = await admin.from("order_items").insert(items);
  if (itemsErr) return { ok: false, reason: `order_items insert failed: ${itemsErr.message}` };
  await admin.from("order_status_history").insert({ order_id: newOrder.id, status: "paid", note: "Payment captured via Fastrr" });

  for (const l of resolvedItems) {
    await admin.rpc("fulfil_inventory", { p_variant: l.variant_id, p_qty: l.quantity, p_product: l.product_id });
  }

  const sellers = [...new Set(resolvedItems.map((l) => l.supplier_id))];
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

    const sellerAmount = resolvedItems.filter((l) => l.supplier_id === sellerId).reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    await admin.from("escrow_holds").insert({ order_id: newOrder.id, seller_id: sellerId, amount: sellerAmount, status: "held" });
  }

  const { data: cart } = await admin.from("carts").select("id").eq("user_id", profile.id).single();
  if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);

  // Convert any Loyalty Points hold on this order into a permanent debit --
  // the block already reduced *available* balance during checkout; this
  // now reduces the actual balance to match. Blocks are keyed by whatever
  // order_id Fastrr passed to the Block Points call, which may or may not
  // be this same cart_id -- best-effort match.
  const { data: block } = await admin
    .from("wallet_point_blocks")
    .select("id, user_id, points, status")
    .eq("fastrr_order_id", payload.cart_id)
    .eq("status", "blocked")
    .maybeSingle();
  if (block) {
    const { data: wallet } = await admin.from("wallets").select("balance, blocked_balance").eq("user_id", block.user_id).maybeSingle();
    await admin
      .from("wallets")
      .update({
        balance: Math.max(0, Number(wallet?.balance ?? 0) - block.points),
        blocked_balance: Math.max(0, Number(wallet?.blocked_balance ?? 0) - block.points),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", block.user_id);
    await admin.from("wallet_transactions").insert({
      user_id: block.user_id, kind: "debit", amount: -block.points, reference: newOrder.id,
      balance_after: Math.max(0, Number(wallet?.balance ?? 0) - block.points),
    });
    await admin.from("wallet_point_blocks").update({ status: "used", updated_at: new Date().toISOString() }).eq("id", block.id);
  }

  return { ok: true, orderId: newOrder.id };
}
