import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PlanRow = {
  id: string;
  code: string;
  audience: string;
  tier: string;
  name: string;
  tagline: string | null;
  price_inr: number;
  billing_period: string;
  features: string[];
  highlight: boolean;
  commission_percent: number;
};

export async function listPlansByAudience(audience: string): Promise<PlanRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("id, code, audience, tier, name, tagline, price_inr, billing_period, features, highlight, commission_percent")
    .eq("audience", audience)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((p) => ({
    ...p,
    price_inr: Number(p.price_inr),
    features: (p.features as string[]) ?? [],
    commission_percent: Number(p.commission_percent ?? 0),
  }));
}

export type PlanFeatureLimit = { planId: string; featureKey: string; limitValue: number | null };

// Backs the comparison table -- one row per plan's numeric feature limits,
// across every plan in this audience at once.
export async function listPlanFeatureLimits(planIds: string[]): Promise<PlanFeatureLimit[]> {
  if (!isSupabaseConfigured() || planIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("plan_feature_limits").select("plan_id, feature_key, limit_value").in("plan_id", planIds);
  return (data ?? []).map((r) => ({ planId: r.plan_id, featureKey: r.feature_key, limitValue: r.limit_value }));
}

export type EnterpriseService = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  priceInr: number | null;
  features: string[];
};

export async function listEnterpriseServices(): Promise<EnterpriseService[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("enterprise_services")
    .select("id, code, name, description, category, price_inr, features")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((s) => ({
    id: s.id, code: s.code, name: s.name, description: s.description, category: s.category,
    priceInr: s.price_inr === null ? null : Number(s.price_inr),
    features: (s.features as string[]) ?? [],
  }));
}

export async function listAllAudiences(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("audience").eq("active", true);
  return [...new Set((data ?? []).map((p) => p.audience))];
}

export type MySubscription = {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
  planName: string;
  planTier: string;
  audience: string;
  priceInr: number;
  features: string[];
};

export async function getMySubscription(userId: string): Promise<MySubscription | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end, plans!inner(id, name, tier, audience, price_inr, features)")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const plan = data.plans as unknown as { id: string; name: string; tier: string; audience: string; price_inr: number; features: string[] };
  return {
    id: data.id,
    planId: plan.id,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    planName: plan.name,
    planTier: plan.tier,
    audience: plan.audience,
    priceInr: Number(plan.price_inr),
    features: plan.features ?? [],
  };
}
