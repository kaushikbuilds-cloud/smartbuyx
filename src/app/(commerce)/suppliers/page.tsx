import Link from "next/link";
import { Store } from "lucide-react";
import { listSuppliers } from "@/features/suppliers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shop/star-rating";
import { TrustScoreBadge } from "@/components/shop/trust-score-badge";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

export const metadata = { title: "Verified Suppliers" };

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();

  return (
    <main className="container mx-auto space-y-4 px-4 py-4">
      <CatalogBreadcrumb trail={[{ label: "Suppliers" }]} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Verified Suppliers</h1>
          <p className="text-xs text-muted-foreground">
            Ranked by SmartBuyX Trust Score — {suppliers.length} verified businesses
          </p>
        </div>
        <Button variant="gradient" size="sm" asChild>
          <Link href="/rfq/new">Get quotes</Link>
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Store className="h-10 w-10" />
          No suppliers listed yet.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link key={s.user_id} href={`/suppliers/${s.user_id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{s.business_name}</h3>
                    <TrustScoreBadge score={s.trust_score} verified={s.gstin_verified} size="sm" />
                  </div>
                  {s.bio ? <p className="line-clamp-2 text-sm text-muted-foreground">{s.bio}</p> : null}
                  {s.rating_count > 0 ? <StarRating value={s.rating_avg} count={s.rating_count} /> : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
