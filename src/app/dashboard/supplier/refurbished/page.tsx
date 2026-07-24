import Link from "next/link";
import Image from "next/image";
import { PlusCircle, RefreshCw, ImageOff } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getMyRefurbishedProducts } from "@/features/refurbished/queries";
import { CONDITION_LABELS, QC_LABELS } from "@/features/refurbished/types";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Refurbished Products · Seller" };
export const dynamic = "force-dynamic";

const QC_VARIANT: Record<string, "secondary" | "success" | "destructive"> = {
  pending: "secondary",
  passed: "success",
  failed: "destructive",
};

export default async function SellerRefurbishedPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const products = await getMyRefurbishedProducts(user.id);

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
            <RefreshCw className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Refurbished Products</h1>
            <p className="text-sm text-muted-foreground">Manage your refurbished electronics listings and inspection status.</p>
          </div>
        </div>
        <Button asChild variant="gradient">
          <Link href="/dashboard/supplier/refurbished/new"><PlusCircle className="h-4 w-4" /> List a refurbished item</Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          No refurbished listings yet.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/dashboard/supplier/refurbished/${p.id}/edit`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    {p.images[0]?.url ? (
                      <Image src={p.images[0].url} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-6 w-6" /></div>
                    )}
                  </div>
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-sm font-bold">{formatINR(p.base_price)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{CONDITION_LABELS[p.condition_grade]}</Badge>
                    <Badge variant={QC_VARIANT[p.qc_status]}>{QC_LABELS[p.qc_status]}</Badge>
                  </div>
                  {p.qc_status === "failed" && p.qc_notes ? (
                    <p className="text-xs text-destructive">{p.qc_notes}</p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
