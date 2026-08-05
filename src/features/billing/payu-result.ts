// Plan-payment counterpart to features/orders/payu-result.ts -- same PayU
// hash verification, shared by the plan-checkout redirect callback and its
// webhook. Kept separate from the order-payment handler since it activates a
// subscription (not fulfilPaidOrder) and reads from plan_payments (not
// payments).
import { verifyPayuResponseHash } from "@/lib/payu/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateSubscription } from "./actions";

export type PayuPlanResultOutcome = { userId: string | null; status: "captured" | "failed" | "invalid" };

export async function handlePayuPlanResult(form: FormData): Promise<PayuPlanResultOutcome> {
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
  const { data: planPayment } = await admin
    .from("plan_payments")
    .select("id, user_id, plan_id, status")
    .eq("payu_txnid", txnid)
    .maybeSingle();

  if (!valid || !planPayment) {
    if (planPayment) {
      await admin.from("plan_payments").update({ status: "failed", raw: Object.fromEntries(form) }).eq("payu_txnid", txnid);
    }
    return { userId: planPayment?.user_id ?? null, status: "invalid" };
  }

  // Idempotent: only act the first time this payment is seen as captured, in
  // case both the redirect callback and the webhook arrive.
  if (status === "success") {
    if (planPayment.status !== "captured") {
      await admin
        .from("plan_payments")
        .update({ payu_mihpayid: mihpayid || null, payu_mode: mode || null, status: "captured", raw: Object.fromEntries(form) })
        .eq("payu_txnid", txnid);
      await activateSubscription(planPayment.user_id, planPayment.plan_id, txnid);
    }
    return { userId: planPayment.user_id, status: "captured" };
  }

  await admin.from("plan_payments").update({ status: "failed", raw: Object.fromEntries(form) }).eq("payu_txnid", txnid);
  return { userId: planPayment.user_id, status: "failed" };
}
