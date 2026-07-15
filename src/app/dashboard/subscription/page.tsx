import Link from "next/link";
import { Crown, Check, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getMySubscription } from "@/features/billing/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell, ComingSoonCard } from "@/components/dashboard/page-shell";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";

export const metadata = { title: "My Subscription" };

export default async function MySubscriptionPage() {
  const { user } = await requireUser();
  const sub = await getMySubscription(user.id);

  return (
    <PageShell
      title="My Subscription"
      description="Manage your SmartBuyX plan."
      actions={<Button variant="outline" asChild><Link href="/plans">Browse plans</Link></Button>}
    >
      {!sub ? (
        <ComingSoonCard message="You don't have an active pro subscription. Browse plans to unlock priority listing, unlimited leads and more." />
      ) : (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm text-white/80"><Crown className="h-4 w-4" /> Active plan</p>
                <h2 className="mt-1 text-2xl font-bold">{sub.planName}</h2>
                <p className="text-sm capitalize text-white/80">{sub.audience} · {sub.planTier}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{sub.priceInr === 0 ? "Free" : formatINR(sub.priceInr)}</p>
                {sub.currentPeriodEnd ? (
                  <p className="text-xs text-white/80">Renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN")}</p>
                ) : null}
              </div>
            </div>
          </div>
          <CardContent className="space-y-4 p-6">
            <ul className="space-y-2">
              {sub.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link href="/plans">Change plan <ArrowRight className="h-4 w-4" /></Link></Button>
              <CancelSubscriptionButton subscriptionId={sub.id} />
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
