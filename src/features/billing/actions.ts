"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/guards";
import { generatePayuRequestHash, payuBaseUrl, txnidForPlanPayment, isPayuConfigured } from "@/lib/payu/client";
import { safeErrorMessage } from "@/lib/utils/safe-error";

export type PlanOrderResult =
  | { ok: true; paymentId: string }
  | { ok: false; error: string };

// Free plans skip PayU entirely. Paid plans get a `plan_payments` row (mirrors
// how `payments` backs order checkout) and the client navigates to the same
// server-rendered auto-submit bridge-page pattern used for orders.
export async function startPlanCheckout(planId: string): Promise<PlanOrderResult> {
  const { user } = await requireUser();
  if (!isPayuConfigured()) return { ok: false, error: "Payments are not configured yet." };
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("id, price_inr, name, billing_period")
    .eq("id", planId)
    .single();
  if (!plan) return { ok: false, error: "Plan not found." };

  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();
  if (!profile?.phone) return { ok: false, error: "Add a phone number to your account before subscribing." };

  const price = Number(plan.price_inr);
  if (price <= 0) {
    await activateSubscription(user.id, planId, null);
    return { ok: false, error: "FREE_ACTIVATED" }; // sentinel handled client-side
  }

  const admin = createAdminClient();
  const { data: planPayment, error: insertErr } = await admin
    .from("plan_payments")
    .insert({ user_id: user.id, plan_id: planId, amount: price, status: "created" })
    .select("id")
    .single();
  if (insertErr || !planPayment) return { ok: false, error: insertErr?.message ?? "Could not start payment." };

  try {
    const key = process.env.PAYU_MERCHANT_KEY!;
    const txnid = txnidForPlanPayment(planPayment.id);
    const amount = price.toFixed(2);
    const productinfo = `SmartBuyX ${plan.name} Plan`;
    const firstname = (profile.full_name ?? user.email ?? "Customer").split(" ")[0];
    const email = user.email ?? "";
    const phone = profile.phone;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const surl = `${appUrl}/api/payu/plan-callback`;
    const furl = `${appUrl}/api/payu/plan-callback`;

    const hash = generatePayuRequestHash({ key, txnid, amount, productinfo, firstname, email });
    const payuFields = { payuUrl: payuBaseUrl(), key, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash };

    await admin.from("plan_payments").update({ payu_txnid: txnid, raw: { payu_request_fields: payuFields } }).eq("id", planPayment.id);

    return { ok: true, paymentId: planPayment.id };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Could not start payment.", "startPlanCheckout") };
  }
}

export async function activateSubscription(userId: string, planId: string, payuTxnid: string | null): Promise<void> {
  const admin = createAdminClient();

  const { data: plan } = await admin.from("plans").select("audience, billing_period").eq("id", planId).single();
  const periodDays = plan?.billing_period === "yearly" ? 365 : 30;
  const periodEnd = new Date(Date.now() + periodDays * 86400000).toISOString();

  // Deactivate any existing active subscription for this audience so the user
  // has exactly one active plan per pro-audience at a time.
  if (plan?.audience) {
    const { data: existingPlans } = await admin.from("plans").select("id").eq("audience", plan.audience);
    const planIds = (existingPlans ?? []).map((p) => p.id);
    if (planIds.length > 0) {
      await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", userId)
        .in("plan_id", planIds)
        .eq("status", "active");
    }
  }

  await admin.from("subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    status: "active",
    current_period_end: periodEnd,
    payu_txnid: payuTxnid,
  });

  revalidatePath("/dashboard/subscription");
  revalidatePath("/plans");
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);
  revalidatePath("/dashboard/subscription");
}

// Enterprise services are quote/consultation-based ("Contact us"), not
// self-serve checkout -- this just queues a request for the team to follow
// up on, rather than faking a purchase flow for services that need a human.
export async function requestEnterpriseService(serviceId: string): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("enterprise_service_requests").insert({ user_id: user.id, service_id: serviceId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
