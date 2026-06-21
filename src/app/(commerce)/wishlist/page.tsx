import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listWishlist } from "@/features/catalog/wishlist-queries";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const { user } = await requireUser();
  const products = await listWishlist(user.id);

  return (
    <main className="container mx-auto space-y-4 px-4 py-4">
      <CatalogBreadcrumb trail={[{ label: "My Wishlist" }]} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">My Wishlist</h1>
          <p className="text-xs text-muted-foreground">
            {products.length} item{products.length === 1 ? "" : "s"} · auto price alerts on every save
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
          <Heart className="h-12 w-12" />
          <h2 className="text-xl font-bold text-foreground">Your wishlist is empty</h2>
          <Button variant="gradient" asChild><Link href="/products">Explore products</Link></Button>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </main>
  );
}
