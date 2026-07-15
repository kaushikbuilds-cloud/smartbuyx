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
};

export async function listPlansByAudience(audience: string): Promise<PlanRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("id, code, audience, tier, name, tagline, price_inr, billing_period, features, highlight")
    .eq("audience", audience)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((p) => ({ ...p, price_inr: Number(p.price_inr), features: (p.features as string[]) ?? [] }));
}

export async function listAllAudiences(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("audience").eq("active", true);
  return [...new Set((data ?? []).map((p) => p.audience))];
}

export type MySubscription = {
  id: string;
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
    .select("id, status, current_period_end, plans!inner(name, tier, audience, price_inr, features)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const plan = data.plans as unknown as { name: string; tier: string; audience: string; price_inr: number; features: string[] };
  return {
    id: data.id,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    planName: plan.name,
    planTier: plan.tier,
    audience: plan.audience,
    priceInr: Number(plan.price_inr),
    features: plan.features ?? [],
  };
}
