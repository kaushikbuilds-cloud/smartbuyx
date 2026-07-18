import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Store } from "lucide-react";
import { getSupplier, getSupplierProducts } from "@/features/suppliers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shop/star-rating";
import { TrustScoreBadge } from "@/components/shop/trust-score-badge";
import { ProductCard } from "@/components/shop/product-card";

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [s, products] = await Promise.all([getSupplier(id), getSupplierProducts(id)]);
  if (!s) notFound();

  const memberSinceYear = s.member_since ? new Date(s.member_since).getFullYear() : null;

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                {s.store_logo_url ? (
                  <Image src={s.store_logo_url} alt={`${s.business_name} logo`} width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-7 w-7 text-muted-foreground" />
                )}
              </span>
              <div>
                <h1 className="text-2xl font-bold">{s.business_name}</h1>
                {s.bio ? <p className="mt-1 text-muted-foreground">{s.bio}</p> : null}
              </div>
            </div>
            <TrustScoreBadge score={s.trust_score} verified={s.gstin_verified} />
          </div>

          <div className="flex flex-wrap gap-2">
            {s.gstin_verified ? <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> GST verified</Badge> : null}
            {s.verified_business ? <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Verified business</Badge> : null}
            {memberSinceYear ? <Badge variant="secondary">On SmartBuyX since {memberSinceYear}</Badge> : null}
            {s.business_started_on ? <Badge variant="secondary">In business since {new Date(s.business_started_on).getFullYear()}</Badge> : null}
            {s.avg_response_minutes ? <Badge variant="secondary">Replies in ~{s.avg_response_minutes}m</Badge> : null}
          </div>

          {s.rating_count > 0 ? <StarRating value={s.rating_avg} count={s.rating_count} /> : null}
          {s.service_pincodes?.length ? (
            <p className="text-sm text-muted-foreground">Serves: {s.service_pincodes.join(", ")}</p>
          ) : null}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Products ({products.length})</h2>
        {products.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">This seller hasn&apos;t listed any products yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </main>
  );
}
