import { NextResponse, type NextRequest } from "next/server";
import { verifyPayuResponseHash } from "@/lib/payu/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfilPaidOrder } from "@/features/orders/fulfil-paid-order";

// Both surl and furl point here (see createCheckoutOrder) -- PayU decides
// success vs failure server-side and POSTs the outcome in `status`, so one
// route reading that field is simpler than duplicating verification logic
// across two files. This is effectively PayU's webhook: the hash (not
// same-origin/CSRF checks) is what proves the POST really came from PayU,
// exactly like the Razorpay webhook route this replaces.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const get = (k: string) => (form.get(k) as string | null) ?? "";

  const key = get("key");
  const txnid = get("txnid");
  const amount = get("amount");
  const productinfo = get("productinfo");
  const firstname = get("firstname");
  const email = get("email");
  const status = get("status");
  const hash = get("hash");
  const mihpayid = get("mihpayid");
  const mode = get("mode");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const valid = txnid && verifyPayuResponseHash({ key, txnid, amount, productinfo, firstname, email, status, hash });

  const admin = createAdminClient();
  const { data: payment } = await admin.from("payments").select("order_id").eq("payu_txnid", txnid).maybeSingle();

  if (!valid || !payment) {
    // Either a forged/corrupted callback, or we have no matching payment row
    // -- never trust this response either way.
    if (payment) {
      await admin.from("payments").update({ status: "failed", raw: Object.fromEntries(form) }).eq("payu_txnid", txnid);
    }
    return NextResponse.redirect(`${appUrl}/checkout/failure${payment ? `?order=${payment.order_id}` : ""}`, 303);
  }

  if (status === "success") {
    await admin
      .from("payments")
      .update({ payu_mihpayid: mihpayid || null, payu_mode: mode || null, status: "captured", raw: Object.fromEntries(form) })
      .eq("payu_txnid", txnid);
    await fulfilPaidOrder(payment.order_id);
    return NextResponse.redirect(`${appUrl}/checkout/success?order=${payment.order_id}`, 303);
  }

  await admin.from("payments").update({ status: "failed", raw: Object.fromEntries(form) }).eq("payu_txnid", txnid);
  return NextResponse.redirect(`${appUrl}/checkout/failure?order=${payment.order_id}`, 303);
}
