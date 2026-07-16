"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/guards";
import { razorpay, toPaise } from "@/lib/razorpay/client";
import { verifyPaymentSignature } from "@/lib/razorpay/verify";
import { safeErrorMessage } from "@/lib/utils/safe-error";

export type PlanOrderResult =
  | { ok: true; razorpayOrderId: string; amount: number; keyId: string; planId: string }
  | { ok: false; error: string };

// Free plans skip Razorpay entirely.
export async function startPlanCheckout(planId: string): Promise<PlanOrderResult> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("id, price_inr, name, billing_period")
    .eq("id", planId)
    .single();
  if (!plan) return { ok: false, error: "Plan not found." };

  const price = Number(plan.price_inr);
  if (price <= 0) {
    await activateSubscription(user.id, planId, null);
    return { ok: false, error: "FREE_ACTIVATED" }; // sentinel handled client-side
  }

  try {
    const rzpOrder = await razorpay().orders.create({
      amount: toPaise(price),
      currency: "INR",
      receipt: `plan_${planId.slice(0, 8)}_${Date.now()}`,
      notes: { plan_id: planId, user_id: user.id, kind: "subscription" },
    });
    return {
      ok: true,
      razorpayOrderId: rzpOrder.id,
      amount: toPaise(price),
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      planId,
    };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Could not start payment.", "startPlanCheckout") };
  }
}

export async function verifyPlanPayment(input: {
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser();

  const valid = verifyPaymentSignature({
    orderId: input.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  });
  if (!valid) return { ok: false, error: "Payment verification failed." };

  await activateSubscription(user.id, input.planId, input.razorpayOrderId);
  return { ok: true };
}

async function activateSubscription(userId: string, planId: string, razorpayOrderId: string | null): Promise<void> {
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
    razorpay_subscription_id: razorpayOrderId,
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
