import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSupplier } from "@/features/suppliers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shop/star-rating";
import { TrustScoreBadge } from "@/components/shop/trust-score-badge";

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSupplier(id);
  if (!s) notFound();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{s.business_name}</h1>
              {s.bio ? <p className="mt-1 text-muted-foreground">{s.bio}</p> : null}
            </div>
            <TrustScoreBadge score={s.trust_score} verified={s.gstin_verified} />
          </div>

          <div className="flex flex-wrap gap-2">
            {s.gstin_verified ? <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> GST verified</Badge> : null}
            {s.verified_business ? <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Verified business</Badge> : null}
            {s.business_started_on ? <Badge variant="secondary">Since {new Date(s.business_started_on).getFullYear()}</Badge> : null}
            {s.avg_response_minutes ? <Badge variant="secondary">Replies in ~{s.avg_response_minutes}m</Badge> : null}
          </div>

          {s.rating_count > 0 ? <StarRating value={s.rating_avg} count={s.rating_count} /> : null}
          {s.service_pincodes?.length ? (
            <p className="text-sm text-muted-foreground">Serves: {s.service_pincodes.join(", ")}</p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
