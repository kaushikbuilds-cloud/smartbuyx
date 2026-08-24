import { NextResponse, type NextRequest } from "next/server";
import { fulfillFastrrOrder, type FastrrWebhookPayload } from "@/features/orders/fastrr-fulfil";

// Registered as the Order Webhook (Real Time, "Order Placed" stage) in
// Fastrr's dashboard. The integration guide's documented example payload
// ({order_id, cart_data, status, phone, email, payment_type,
// total_amount_payable}) does NOT match what Fastrr actually sends in
// production -- confirmed via live runtime logs, which show
// {cart_id, latest_stage, items[], total_price, billing_address,
// shipping_address, ...} instead. This parses the real shape.
//
// No signature/HMAC is present on this webhook (same as the guide's
// example showed), so authenticity instead comes from items[].variant_id
// matching our own fastrr_numeric_id values -- only real checkout traffic
// through our access-token flow would carry those.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as FastrrWebhookPayload | null;
  if (!body?.cart_id || !Array.isArray(body.items)) {
    console.error("[fastrr-order-webhook] invalid payload", body);
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (body.latest_stage !== "ORDER_PLACED") {
    return NextResponse.json({ received: true, stage: body.latest_stage });
  }

  const result = await fulfillFastrrOrder(body);
  if (!result.ok) {
    // Logged for manual reconciliation -- same category of issue as a
    // stuck PayU transaction: money/order exists on Fastrr's side but
    // couldn't be matched to a buyer/catalog item here.
    console.error("[fastrr-order-webhook] fulfilment failed", { cartId: body.cart_id, reason: result.reason });
    return NextResponse.json({ received: true, matched: false, reason: result.reason });
  }

  return NextResponse.json({ received: true, matched: true, orderId: result.orderId });
}
