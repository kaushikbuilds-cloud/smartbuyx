import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay/verify";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-to-server confirmation. Idempotent: safe if the client callback already finalized.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminClient();

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const rzpOrderId: string | undefined =
      event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id;
    const rzpPaymentId: string | undefined = event.payload?.payment?.entity?.id;

    if (rzpOrderId) {
      await admin
        .from("payments")
        .update({ razorpay_payment_id: rzpPaymentId ?? null, status: "captured", raw: event })
        .eq("razorpay_order_id", rzpOrderId);

      const { data: payment } = await admin
        .from("payments")
        .select("order_id")
        .eq("razorpay_order_id", rzpOrderId)
        .single();

      if (payment?.order_id) {
        await admin.from("orders").update({ status: "paid" }).eq("id", payment.order_id).eq("status", "pending");
      }
    }
  }

  return NextResponse.json({ received: true });
}
