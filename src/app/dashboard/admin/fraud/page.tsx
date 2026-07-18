import { ShieldAlert } from "lucide-react";
import { listFraudFlags } from "@/features/admin/queries";
import { computeBuyerRisks } from "@/features/ai/fraud";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/dashboard/seller/risk-badge";

export const metadata = { title: "Fraud Monitoring · Admin" };
export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  better_price: "Found better price",
  no_longer_needed: "No longer needed",
};

export default async function AdminFraudPage() {
  const flags = await listFraudFlags();
  const risks = await computeBuyerRisks(flags.map((f) => f.userId));

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-rose-500" />
        <h1 className="text-2xl font-bold">Fraud Monitoring</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Returns flagged for abuse-prone reasons, ranked with each buyer&apos;s behavioral risk score.
      </p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Return</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Buyer risk</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => {
                const risk = risks.get(f.userId);
                return (
                  <tr key={f.returnId} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">#{f.returnId.slice(0, 8)}</td>
                    <td className="p-3">{REASON_LABELS[f.reason] ?? f.reason}</td>
                    <td className="p-3 text-right">{formatINR(f.amount)}</td>
                    <td className="p-3 capitalize">{f.status.replace(/_/g, " ")}</td>
                    <td className="p-3">{risk ? <RiskBadge risk={risk} /> : "—"}</td>
                  </tr>
                );
              })}
              {flags.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No flagged returns. 🎉</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
