import { NextResponse, type NextRequest } from "next/server";
import { verifyYoupiSignature } from "@/lib/youpi/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfilPaidOrder } from "@/features/orders/fulfil-paid-order";

// Register this URL in the YouPI merchant admin as the webhook endpoint:
//   https://www.smartbuyx.in/api/youpi/webhook
// and put the same signing secret in YOUPI_WEBHOOK_SECRET. The order id YouPI
// echoes back is our orders.id (passed as order_id to Youpi.pay). Idempotent:
// fulfilPaidOrder's atomic pending->paid claim means retries are harmless.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyYoupiSignature(raw, req.headers.get("x-gateway-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: { event?: string; orderId?: string; amount?: number | string; utr?: string; paymentId?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (body.event !== "SUCCESS" || !body.orderId) return NextResponse.json({ received: true, ignored: true });

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, amount, status")
    .eq("order_id", body.orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment) return NextResponse.json({ received: true, ignored: true });

  // Never fulfil an order for less than it costs.
  if (Math.abs(Number(body.amount) - Number(payment.amount)) > 0.009) {
    await admin.from("payments").update({ status: "failed", raw: { youpi: body, error: "amount mismatch" } }).eq("id", payment.id);
    return NextResponse.json({ error: "amount mismatch" }, { status: 422 });
  }

  await admin.from("payments").update({ status: "captured", raw: { youpi: body } }).eq("id", payment.id);
  await fulfilPaidOrder(body.orderId);
  return NextResponse.json({ received: true });
}
