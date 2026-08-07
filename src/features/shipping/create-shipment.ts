// Plain module, not "use server" -- same reasoning as fulfil-paid-order.ts:
// this writes shipment state with no auth check of its own, so it must not be
// reachable as a client-callable RPC. Called only from fulfilPaidOrder (after
// payment is verified) and from the seller-triggered retry action (which does
// its own auth + ownership check before calling in).
import { createAdminClient } from "@/lib/supabase/admin";
import { createShiprocketOrder, assignAwb, generateLabel, isShiprocketConfigured } from "@/lib/shiprocket/client";

// Best-effort: on any failure the shipment simply stays "pending" with no awb,
// and the seller can retry from their dashboard (see retryShiprocketBooking).
// Never throws -- must not block order fulfilment if Shiprocket is down.
export async function createShiprocketShipment(shipmentId: string): Promise<void> {
  if (!isShiprocketConfigured()) return;
  const admin = createAdminClient();

  const { data: shipment } = await admin
    .from("shipments")
    .select("id, order_id, seller_id, status")
    .eq("id", shipmentId)
    .single();
  if (!shipment || shipment.status !== "pending") return;

  try {
    const { data: order } = await admin
      .from("orders")
      .select("id, buyer_id, created_at, shipping_address_id")
      .eq("id", shipment.order_id)
      .single();
    if (!order) return;

    const { data: address } = order.shipping_address_id
      ? await admin.from("addresses").select("line1, line2, city, state, pincode").eq("id", order.shipping_address_id).single()
      : { data: null };
    if (!address) return;

    const { data: sellerProfile } = await admin
      .from("supplier_profiles")
      .select("pickup_location_code, pickup_registered")
      .eq("user_id", shipment.seller_id)
      .maybeSingle();
    if (!sellerProfile?.pickup_registered || !sellerProfile.pickup_location_code) {
      await admin
        .from("shipments")
        .update({ raw: { error: "Seller has not set up a pickup address yet (Dashboard → Verification & Payouts)." } })
        .eq("id", shipmentId);
      return;
    }

    const { data: profile } = await admin.from("profiles").select("full_name, phone").eq("id", order.buyer_id).single();
    const {
      data: { user: buyer },
    } = await admin.auth.admin.getUserById(order.buyer_id);

    const { data: items } = await admin
      .from("order_items")
      .select("title, quantity, unit_price, total, variant_id, product_variants(product_id, products(weight_kg, length_cm, breadth_cm, height_cm))")
      .eq("order_id", order.id)
      .eq("supplier_id", shipment.seller_id);
    if (!items || items.length === 0) return;

    const subTotal = items.reduce((sum, i) => sum + Number(i.total), 0);
    // Aggregate a rough package size: sum weights, take the largest single dimension.
    let weightKg = 0, lengthCm = 10, breadthCm = 10, heightCm = 10;
    for (const i of items) {
      const pv = i.product_variants as unknown as { products: { weight_kg: number; length_cm: number; breadth_cm: number; height_cm: number } } | null;
      const p = pv?.products;
      if (p) {
        weightKg += Number(p.weight_kg) * i.quantity;
        lengthCm = Math.max(lengthCm, Number(p.length_cm));
        breadthCm = Math.max(breadthCm, Number(p.breadth_cm));
        heightCm = Math.max(heightCm, Number(p.height_cm));
      } else {
        weightKg += 0.5 * i.quantity;
      }
    }

    const result = await createShiprocketOrder({
      orderId: `${order.id.replace(/-/g, "").slice(0, 14)}-${shipment.seller_id.replace(/-/g, "").slice(0, 6)}`,
      orderDate: new Date(order.created_at).toISOString().slice(0, 16).replace("T", " "),
      pickupLocation: sellerProfile.pickup_location_code,
      billingName: profile?.full_name ?? "Customer",
      billingAddress: [address.line1, address.line2].filter(Boolean).join(", "),
      billingCity: address.city,
      billingState: address.state,
      billingPincode: address.pincode,
      billingPhone: profile?.phone ?? "9999999999",
      billingEmail: buyer?.email ?? "",
      items: items.map((i) => ({ name: i.title, units: i.quantity, selling_price: Number(i.unit_price) })),
      subTotal,
      weightKg: Math.max(weightKg, 0.1),
      lengthCm, breadthCm, heightCm,
    });

    const awbResult = await assignAwb(result.shipment_id);
    const labelUrl = await generateLabel(result.shipment_id).catch(() => null);

    const { data: partner } = await admin.from("delivery_partners").select("id").eq("code", "shiprocket").single();

    await admin
      .from("shipments")
      .update({
        partner_id: partner?.id ?? null,
        partner_order_id: String(result.order_id),
        partner_shipment_id: String(result.shipment_id),
        awb: awbResult.awb_code,
        tracking_number: awbResult.awb_code,
        courier_name: awbResult.courier_name,
        label_url: labelUrl,
        status: "ready_to_ship",
        shipped_at: null,
        updated_at: new Date().toISOString(),
        raw: { shiprocket: result },
      })
      .eq("id", shipmentId);
  } catch (e) {
    await admin
      .from("shipments")
      .update({ raw: { error: e instanceof Error ? e.message : String(e) } })
      .eq("id", shipmentId);
  }
}
