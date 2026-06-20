import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getRfq, getQuotesForRfq } from "@/features/rfq/queries";
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

      <h2 className="mb-3 font-semibold">{quotes.length} quote{quotes.length === 1 ? "" : "s"} received</h2>
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes yet. Suppliers usually respond within a few hours.</p>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => (
            <Card key={q.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{q.supplier_name ?? "Supplier"}</p>
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
          ))}
        </div>
      )}
    </main>
  );
}
