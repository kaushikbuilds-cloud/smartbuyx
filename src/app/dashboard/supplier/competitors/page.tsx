import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getCompetitorAnalysis } from "@/features/seller/competitor-analysis";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Competitor Analysis" };

const POSITION_META = {
  cheapest: { label: "Below market", icon: TrendingDown, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  competitive: { label: "Competitive", icon: Minus, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  expensive: { label: "Above market", icon: TrendingUp, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  no_competition: { label: "No competition", icon: Minus, cls: "bg-muted text-muted-foreground" },
} as const;

export default async function CompetitorAnalysisPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const rows = await getCompetitorAnalysis(user.id);

  return (
    <main className="container mx-auto space-y-4 px-4 py-8">
      <div className="flex items-center gap-2">
        <Scale className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold">Competitor Analysis</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        How your prices compare to other sellers in the same category on SmartBuyX, with pricing guidance.
      </p>

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No categorized products yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const meta = POSITION_META[r.pricePosition];
            return (
              <Card key={r.productId}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Your price: <span className="font-medium text-foreground">{formatINR(r.myPrice)}</span>
                        {r.avgCompetitorPrice ? <> · Category avg: {formatINR(r.avgCompetitorPrice)}</> : null}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
                      <meta.icon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                  </div>

                  <p className="rounded-lg bg-muted/40 p-3 text-sm">{r.recommendation}</p>

                  {r.competitors.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-left text-muted-foreground">
                          <tr>
                            <th className="pb-1 pr-4">Competitor</th>
                            <th className="pb-1 pr-4">Brand</th>
                            <th className="pb-1 pr-4 text-right">Price</th>
                            <th className="pb-1 pr-4 text-right">Rating</th>
                            <th className="pb-1 text-right">Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.competitors.map((c) => (
                            <tr key={c.competitorId} className="border-t">
                              <td className="py-1.5 pr-4">{c.title}</td>
                              <td className="py-1.5 pr-4 text-muted-foreground">{c.brand ?? "—"}</td>
                              <td className="py-1.5 pr-4 text-right">{formatINR(c.price)}</td>
                              <td className="py-1.5 pr-4 text-right">
                                {c.ratingCount > 0 ? `${c.rating.toFixed(1)}★ (${c.ratingCount})` : "—"}
                              </td>
                              <td className="py-1.5 text-right">{c.salesCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
