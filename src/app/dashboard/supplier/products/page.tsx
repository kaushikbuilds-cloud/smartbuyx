import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getSellerProducts } from "@/features/catalog/queries";
import { formatINR } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DeleteProductButton } from "@/components/dashboard/seller/delete-product-button";

export default async function SellerProductsPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const products = await getSellerProducts(user.id);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-muted-foreground">{products.length} listings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/seller/feed" download><Download className="h-4 w-4" /> Export feed</a>
          </Button>
          <Button variant="gradient" asChild>
            <Link href="/dashboard/supplier/products/new"><Plus className="h-4 w-4" /> Add product</Link>
          </Button>
        </div>
      </div>
      <p className="mb-4 -mt-4 text-xs text-muted-foreground">
        Export feed downloads a Google Merchant / Meta Shops-compatible CSV — import it into other marketplaces to sell everywhere from one catalog.
      </p>

      {products.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          You haven&apos;t listed any products yet.
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatINR(p.base_price)} · {p.sales_count} sold · ★ {p.rating_avg.toFixed(1)}
                </p>
              </div>
              <Badge variant={p.status === "active" ? "success" : "secondary"}>{p.status}</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/supplier/products/${p.id}/edit`}>Edit</Link>
              </Button>
              <DeleteProductButton id={p.id} />
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
