import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getRfq, getQuotesForRfq } from "@/features/rfq/queries";
import { compareQuotes } from "@/features/ai/quote-comparison";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrustScoreBadge } from "@/components/shop/trust-score-badge";

export default async function RfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const rfq = await getRfq(id);
  if (!rfq) notFound();
  const isBuyer = rfq.buyer_id === user.id;
  const quotes = await getQuotesForRfq(id);

  // AI quote comparison — only for the buyer, only when there's something to compare.
  const verdict =
    isBuyer && quotes.length >= 2
      ? await compareQuotes(quotes, { title: rfq.title, budgetMin: rfq.budget_min, budgetMax: rfq.budget_max })
      : null;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="mb-6">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{rfq.title}</h1>
              {rfq.description ? <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{rfq.description}</p> : null}
            </div>
            <Badge variant={rfq.status === "open" ? "default" : "success"}>{rfq.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {rfq.pincode ? <Badge variant="secondary">{rfq.pincode}</Badge> : null}
            {rfq.budget_min || rfq.budget_max ? (
              <Badge variant="secondary">
                Budget: {rfq.budget_min ? formatINR(Number(rfq.budget_min)) : "—"} – {rfq.budget_max ? formatINR(Number(rfq.budget_max)) : "—"}
              </Badge>
            ) : null}
            <Badge variant="secondary">Sent to {rfq.target_supplier_count} suppliers</Badge>
          </div>
        </CardContent>
      </Card>

      {verdict ? (
        <Card className="mb-4 border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/30">
          <CardContent className="flex gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {verdict.headline}
                <Badge variant="secondary" className="text-[10px]">
                  {verdict.bestValueBy === "ai" ? "AI pick" : "Best value"}
                </Badge>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{verdict.reasoning}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <h2 className="mb-3 font-semibold">{quotes.length} quote{quotes.length === 1 ? "" : "s"} received</h2>
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes yet. Suppliers usually respond within a few hours.</p>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => {
            const recommended = verdict?.recommendedQuoteId === q.id;
            return (
              <Card key={q.id} className={recommended ? "border-purple-400 ring-1 ring-purple-400" : ""}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        {q.supplier_name ?? "Supplier"}
                        {recommended ? (
                          <Badge className="gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px]">
                            <Sparkles className="h-2.5 w-2.5" /> Recommended
                          </Badge>
                        ) : null}
                      </p>
                      {typeof q.trust_score === "number" ? (
                        <TrustScoreBadge score={q.trust_score} size="sm" />
                      ) : null}
                    </div>
                    <p className="text-xl font-bold">{formatINR(q.amount)}</p>
                  </div>
                  {q.message ? <p className="text-sm text-muted-foreground">{q.message}</p> : null}
                  {isBuyer && rfq.status === "open" ? (
                    <p className="text-xs text-muted-foreground">Reply from your inbox to accept this quote.</p>
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
