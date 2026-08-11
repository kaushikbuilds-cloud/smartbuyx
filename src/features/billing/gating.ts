// Centralized subscription/feature-gating. Every gated action in the app
// should call canUseFeature() before proceeding and incrementUsage() after
// -- server-side, inside the action itself, never only in the UI. Hiding a
// button is not access control; these checks are what actually stops a
// direct API/server-action call from bypassing a plan's limits.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanAudience = "customer" | "supplier" | "d2c_brand" | "contractor" | "architect" | "engineer" | "interior_designer" | "creator";

export type CurrentPlan = {
  id: string;
  code: string;
  tier: string;
  name: string;
  audience: string;
  subscriptionStatus: "active" | "trialing" | "none";
  currentPeriodEnd: string | null;
};

// Calendar-month usage periods -- simpler and more predictable than periods
// anchored to each subscription's individual start date ("6/10 used this
// month" is the mental model users expect).
function currentPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

// Falls back to that audience's Free plan when the user has no active paid
// subscription -- every audience is expected to have exactly one `tier =
// 'free'` plan row (enforced by seed data, not a DB constraint).
export async function getCurrentPlan(userId: string, audience: PlanAudience): Promise<CurrentPlan | null> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, plans!inner(id, code, tier, name, audience)")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub) {
    const plan = sub.plans as unknown as { id: string; code: string; tier: string; name: string; audience: string };
    if (plan.audience === audience) {
      return {
        id: plan.id, code: plan.code, tier: plan.tier, name: plan.name, audience: plan.audience,
        subscriptionStatus: sub.status as "active" | "trialing",
        currentPeriodEnd: sub.current_period_end,
      };
    }
  }

  const { data: freePlan } = await supabase
    .from("plans")
    .select("id, code, tier, name, audience")
    .eq("audience", audience)
    .eq("tier", "free")
    .eq("active", true)
    .maybeSingle();
  if (!freePlan) return null;
  return { ...freePlan, subscriptionStatus: "none", currentPeriodEnd: null };
}

export function isSubscriptionActive(plan: CurrentPlan | null): boolean {
  if (!plan) return false;
  if (plan.tier === "free") return true; // free tier is always "active"
  if (plan.subscriptionStatus === "none") return false;
  if (plan.currentPeriodEnd && new Date(plan.currentPeriodEnd) < new Date()) return false;
  return true;
}

// undefined = feature not available on this plan at all; null = available,
// unlimited; number = available with that numeric cap.
export async function getFeatureLimit(planId: string, featureKey: string, client?: SupabaseClient): Promise<number | null | undefined> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("plan_feature_limits")
    .select("limit_value")
    .eq("plan_id", planId)
    .eq("feature_key", featureKey)
    .maybeSingle();
  if (error || !data) return undefined;
  return data.limit_value;
}

export async function hasFeature(planId: string, featureKey: string): Promise<boolean> {
  return (await getFeatureLimit(planId, featureKey)) !== undefined;
}

export async function getRemainingUsage(userId: string, planId: string, featureKey: string): Promise<number | null> {
  const limit = await getFeatureLimit(planId, featureKey);
  if (limit === undefined) return 0; // no access
  if (limit === null) return null; // unlimited

  const { start } = currentPeriod();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_usage")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .eq("period_start", start)
    .maybeSingle();
  return Math.max(0, limit - (data?.usage_count ?? 0));
}

export type FeatureCheckResult = { ok: true } | { ok: false; reason: "not_subscribed" | "no_access" | "limit_reached"; plan: CurrentPlan | null };

// The single check every gated action should call first.
export async function canUseFeature(userId: string, audience: PlanAudience, featureKey: string): Promise<FeatureCheckResult> {
  const plan = await getCurrentPlan(userId, audience);
  if (!isSubscriptionActive(plan)) return { ok: false, reason: "not_subscribed", plan };
  if (!plan) return { ok: false, reason: "not_subscribed", plan: null };

  const limit = await getFeatureLimit(plan.id, featureKey);
  if (limit === undefined) return { ok: false, reason: "no_access", plan };
  if (limit === null) return { ok: true };

  const remaining = await getRemainingUsage(userId, plan.id, featureKey);
  if ((remaining ?? 0) <= 0) return { ok: false, reason: "limit_reached", plan };
  return { ok: true };
}

// Call only after the gated action actually succeeds -- never pre-increment,
// since a failed downstream step (e.g. an AI call erroring) shouldn't burn
// the user's quota.
export async function incrementUsage(userId: string, featureKey: string): Promise<void> {
  const { start, end } = currentPeriod();
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscription_usage")
    .select("id, usage_count")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .eq("period_start", start)
    .maybeSingle();

  if (existing) {
    await admin.from("subscription_usage").update({ usage_count: existing.usage_count + 1, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await admin.from("subscription_usage").insert({ user_id: userId, feature_key: featureKey, usage_count: 1, period_start: start, period_end: end });
  }
}

export type UsageSummary = { featureKey: string; used: number; limit: number | null };

// Powers the dashboard's usage bars -- every feature this plan has any
// limit row for, with current usage against it.
export async function getUsageSummary(userId: string, plan: CurrentPlan): Promise<UsageSummary[]> {
  const supabase = await createClient();
  const { data: limits } = await supabase.from("plan_feature_limits").select("feature_key, limit_value").eq("plan_id", plan.id);
  if (!limits || limits.length === 0) return [];

  const { start } = currentPeriod();
  const { data: usage } = await supabase
    .from("subscription_usage")
    .select("feature_key, usage_count")
    .eq("user_id", userId)
    .eq("period_start", start);
  const usageMap = new Map((usage ?? []).map((u) => [u.feature_key, u.usage_count]));

  return limits.map((l) => ({ featureKey: l.feature_key, used: usageMap.get(l.feature_key) ?? 0, limit: l.limit_value }));
}

const TIER_ORDER = ["free", "starter", "growth", "premium", "annual"];
export function canUpgrade(currentTier: string): boolean {
  return TIER_ORDER.indexOf(currentTier) < TIER_ORDER.length - 1;
}
