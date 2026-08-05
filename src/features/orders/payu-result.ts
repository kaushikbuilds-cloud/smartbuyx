// Shared by both PayU entry points: the redirect callback (surl/furl, browser
// POST after checkout) and the webhook (server-to-server, doesn't depend on
// the customer's browser making it back to the site). Both receive the same
// field shape from PayU and use the same hash formula to verify authenticity
// -- PayU's docs state the same verification applies to both. fulfilPaidOrder
// is idempotent (atomic pending->paid claim), so it's safe for the webhook
// and the redirect callback to both land on the same order.
import { verifyPayuResponseHash } from "@/lib/payu/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfilPaidOrder } from "./fulfil-paid-order";

export type PayuResultOutcome = { orderId: string | null; status: "captured" | "failed" | "invalid" };

export async function handlePayuResult(form: FormData): Promise<PayuResultOutcome> {
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

  const valid = Boolean(txnid) && verifyPayuResponseHash({ key, txnid, amount, productinfo, firstname, email, status, hash });

  const admin = createAdminClient();
  const { data: payment, error: paymentLookupError } = await admin
    .from("payments")
    .select("order_id")
    .eq("payu_txnid", txnid)
    .maybeSingle();

  // TEMPORARY diagnostic logging while investigating a payment row that
  // exists (confirmed via direct SQL) but this lookup reports not found.
  // Logging the query error itself this time -- previously only checked
  // whether `data` was present, which silently masked an auth/query error
  // as a plain "not found" result.
  if (!valid || !payment) {
    console.error("[payu-result] unverifiable callback", {
      txnid: JSON.stringify(txnid), txnidLength: txnid.length, status, hashPresent: Boolean(hash),
      keyMatchesEnv: key === process.env.PAYU_MERCHANT_KEY,
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
      paymentRowFound: Boolean(payment),
      paymentLookupError: paymentLookupError ? { message: paymentLookupError.message, code: paymentLookupError.code, details: paymentLookupError.details, hint: paymentLookupError.hint } : null,
      amount, productinfo, firstname,
    });
  }

  if (!valid || !payment) {
    // Either a forged/corrupted POST, or no matching payment row -- never
    // trust it either way.
    if (payment) {
      await admin.from("payments").update({ status: "failed", raw: Object.fromEntries(form) }).eq("payu_txnid", txnid);
    }
    return { orderId: payment?.order_id ?? null, status: "invalid" };
  }

  if (status === "success") {
    await admin
      .from("payments")
      .update({ payu_mihpayid: mihpayid || null, payu_mode: mode || null, status: "captured", raw: Object.fromEntries(form) })
      .eq("payu_txnid", txnid);
    await fulfilPaidOrder(payment.order_id);
    return { orderId: payment.order_id, status: "captured" };
  }

  await admin.from("payments").update({ status: "failed", raw: Object.fromEntries(form) }).eq("payu_txnid", txnid);
  return { orderId: payment.order_id, status: "failed" };
}
