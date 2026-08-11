import { listAllSubscriptions } from "@/features/admin/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionRowActions } from "@/components/admin/subscription-row-actions";

export const metadata = { title: "Subscriptions · Admin" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default", trialing: "secondary", cancelled: "destructive", expired: "destructive", past_due: "destructive",
};

export default async function AdminSubscriptionsPage() {
  const subs = await listAllSubscriptions();
  const activeRevenue = subs.filter((s) => s.status === "active" || s.status === "trialing").reduce((sum, s) => sum + s.priceInr, 0);

  return (
    <main className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          MRR (active + trial): <span className="font-semibold text-foreground">{formatINR(activeRevenue)}</span> · {subs.length} total
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Audience</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Renews</th>
                <th className="p-3">Since</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-3">{s.userName ?? s.userId.slice(0, 8)}</td>
                  <td className="p-3">{s.planName} <span className="text-xs text-muted-foreground">({s.planCode})</span></td>
                  <td className="p-3 capitalize text-muted-foreground">{s.audience}</td>
                  <td className="p-3 text-right font-semibold">{s.priceInr === 0 ? "Free" : formatINR(s.priceInr)}</td>
                  <td className="p-3"><Badge variant={STATUS_VARIANT[s.status] ?? "secondary"}>{s.status}</Badge></td>
                  <td className="p-3 text-muted-foreground">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-3"><SubscriptionRowActions subscriptionId={s.id} status={s.status} /></td>
                </tr>
              ))}
              {subs.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No subscriptions yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
