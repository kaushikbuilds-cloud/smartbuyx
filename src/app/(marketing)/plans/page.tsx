import { Check, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { listPlansByAudience, listPlanFeatureLimits, listEnterpriseServices } from "@/features/billing/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AudienceTabs } from "@/components/billing/audience-tabs";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { EnterpriseServicesGrid } from "@/components/billing/enterprise-services-grid";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";

export const metadata = { title: "Pricing" };

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const { for: audience = "customer" } = await searchParams;
  const session = await getSession();

  if (audience === "enterprise") {
    const services = await listEnterpriseServices();
    return (
      <main className="container mx-auto space-y-8 px-4 py-16">
        <div className="text-center">
          <Badge variant="secondary" className="mb-3 gap-1"><Sparkles className="h-3 w-3" /> Grow with SmartBuyX</Badge>
          <h1 className="text-4xl font-bold">Subscription Plans</h1>
          <p className="mt-2 text-muted-foreground">Choose your role and the right plan for your needs</p>
        </div>
        <AudienceTabs active={audience} />
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold">Enterprise Services</h2>
          <p className="mt-2 text-muted-foreground">
            Company setup, compliance, and growth services — handled by our team, not self-serve subscriptions.
          </p>
        </div>
        <EnterpriseServicesGrid services={services} loggedIn={Boolean(session)} />
      </main>
    );
  }

  const plans = await listPlansByAudience(audience);
  const limits = await listPlanFeatureLimits(plans.map((p) => p.id));

  let currentSubscriptionPlanId: string | null = null;

  if (session) {
    const supabase = await createClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();
    currentSubscriptionPlanId = sub?.plan_id ?? null;
  }

  return (
    <main className="container mx-auto space-y-8 px-4 py-16">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3 gap-1"><Sparkles className="h-3 w-3" /> Grow with SmartBuyX</Badge>
        <h1 className="text-4xl font-bold">Subscription Plans</h1>
        <p className="mt-2 text-muted-foreground">Choose your role and the right plan for your needs</p>
      </div>

      <AudienceTabs active={audience} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = currentSubscriptionPlanId === plan.id;
          const isFree = plan.price_inr === 0;
          return (
            <Card key={plan.id} className={plan.highlight ? "relative border-purple-400 shadow-lg shadow-purple-500/10" : "relative"}>
              {plan.highlight ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                  {plan.tagline ?? "Most Popular"}
                </div>
              ) : null}
              <CardContent className="space-y-4 p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    {plan.tagline && !plan.highlight ? <Badge variant="secondary" className="text-[10px]">{plan.tagline}</Badge> : null}
                  </div>
                  <p className="mt-1 text-3xl font-bold">
                    {isFree ? "₹0" : formatINR(plan.price_inr)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.billing_period === "yearly" ? "year" : "month"}
                    </span>
                  </p>
                  {audience === "supplier" ? (
                    <p className="mt-1 text-sm font-medium text-emerald-600">
                      {plan.commission_percent > 0 ? `+ ${plan.commission_percent}% commission per order` : "0% commission — keep 100%"}
                    </p>
                  ) : null}
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {session ? (
                  <SubscribeButton planId={plan.id} isFree={isFree} isCurrent={isCurrent} />
                ) : (
                  <a href="/login" className="block w-full rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-center text-sm font-medium text-white">
                    Log in to subscribe
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
        {plans.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground">No plans available for this category yet.</p>
        ) : null}
      </div>

      {plans.length > 0 ? (
        <div>
          <h2 className="mb-4 text-center text-xl font-bold">Compare plans</h2>
          <PlanComparisonTable plans={plans} limits={limits} />
        </div>
      ) : null}
    </main>
  );
}
