import { NextResponse, type NextRequest } from "next/server";
import { fetchOrderDetails } from "@/lib/fastrr/client";
import { fulfillFastrrOrder } from "@/features/orders/fastrr-fulfil";

// Registered as <SELLER_REGISTERED_WEBHOOK_URL> in Fastrr's dashboard
// (Settings -> Webhooks). Their example payload has no signature/HMAC header
// (unlike every other call in this integration, which are all HMAC-signed) --
// so this never trusts the webhook body alone. Instead it takes only the
// order_id from the POST and independently re-fetches the order server-to-
// server via fetchOrderDetails (HMAC-authenticated, using our own secret),
// then acts on that response.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const orderId = body?.order_id;
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  let order;
  try {
    order = await fetchOrderDetails(orderId);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "could not verify order" }, { status: 502 });
  }

  if (order.status !== "SUCCESS") {
    return NextResponse.json({ received: true, status: order.status });
  }

  const result = await fulfillFastrrOrder(order);
  if (!result.ok) {
    // Logged for manual reconciliation -- same category of issue as a
    // stuck PayU transaction: money/order exists on Fastrr's side but
    // couldn't be matched to a buyer here.
    console.error("[fastrr-order-webhook] fulfilment failed", { orderId, reason: result.reason });
    return NextResponse.json({ received: true, matched: false, reason: result.reason });
  }

  return NextResponse.json({ received: true, matched: true, orderId: result.orderId });
}
