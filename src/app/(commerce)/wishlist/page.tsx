import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listWishlist } from "@/features/catalog/wishlist-queries";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const { user } = await requireUser();
  const products = await listWishlist(user.id);

  if (products.length === 0) {
    return (
      <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-24 text-center">
        <Heart className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Your wishlist is empty</h1>
        <Button variant="gradient" asChild><Link href="/products">Explore products</Link></Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Wishlist</h1>
      <ProductGrid products={products} />
    </main>
  );
}
