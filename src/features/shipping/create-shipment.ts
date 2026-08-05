// Plain module, not "use server" -- same reasoning as fulfil-paid-order.ts:
// this writes shipment state with no auth check of its own, so it must not be
// reachable as a client-callable RPC. Called only from fulfilPaidOrder (after
// payment is verified) and from the seller-triggered retry action (which does
// its own auth + ownership check before calling in).
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWaybill, createOrder, createPickupRequest, checkPincodeServiceable, isDelhiveryConfigured } from "@/lib/delhivery/client";

// Best-effort: on any failure the shipment simply stays "pending" with no awb,
// and the seller can retry from their dashboard (see retryDelhiveryBooking).
// Never throws -- must not block order fulfilment if Delhivery is down.
export async function createDelhiveryShipment(shipmentId: string): Promise<void> {
  if (!isDelhiveryConfigured()) return;
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

    const serviceable = await checkPincodeServiceable(address.pincode);
    if (!serviceable) {
      await admin
        .from("shipments")
        .update({ raw: { error: `Delhivery does not currently service pincode ${address.pincode}.` } })
        .eq("id", shipmentId);
      return;
    }

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

    const waybill = await fetchWaybill();
    const result = await createOrder({
      waybill,
      orderId: `${order.id.replace(/-/g, "").slice(0, 14)}-${shipment.seller_id.replace(/-/g, "").slice(0, 6)}`,
      pickupLocation: sellerProfile.pickup_location_code,
      paymentMode: "Prepaid", // already captured via PayU
      consigneeName: profile?.full_name ?? "Customer",
      consigneeAddress: [address.line1, address.line2].filter(Boolean).join(", "),
      consigneeCity: address.city,
      consigneeState: address.state,
      consigneePincode: address.pincode,
      consigneePhone: profile?.phone ?? "9999999999",
      productsDesc: items.map((i) => i.title).join(", ").slice(0, 200),
      subTotal,
      weightKg: Math.max(weightKg, 0.1),
      lengthCm, breadthCm, heightCm,
    });

    // Best-effort -- a missed pickup request doesn't block the booking itself.
    await createPickupRequest({
      warehouseName: sellerProfile.pickup_location_code,
      pickupDate: new Date().toISOString().slice(0, 10),
      pickupTime: "14:00:00",
      count: 1,
    });

    const { data: partner } = await admin.from("delivery_partners").select("id").eq("code", "delhivery").single();

    await admin
      .from("shipments")
      .update({
        partner_id: partner?.id ?? null,
        partner_order_id: result.waybill,
        partner_shipment_id: result.waybill,
        awb: result.waybill,
        tracking_number: result.waybill,
        courier_name: "Delhivery",
        status: "ready_to_ship",
        shipped_at: null,
        updated_at: new Date().toISOString(),
        raw: { delhivery: result.raw },
      })
      .eq("id", shipmentId);
  } catch (e) {
    await admin
      .from("shipments")
      .update({ raw: { error: e instanceof Error ? e.message : String(e) } })
      .eq("id", shipmentId);
  }
}
