import { notFound } from "next/navigation";
import { getProductBySlug, getProductVariants, getProductReviews } from "@/features/catalog/queries";
import { getWishlistedIds } from "@/features/catalog/wishlist-queries";
import { getSession } from "@/lib/auth/guards";
import { formatINR } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shop/star-rating";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ReviewList } from "@/components/shop/review-list";
import { TrackPricePopover } from "@/components/shop/track-price-popover";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.title ?? "Product" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [variants, reviews, session] = await Promise.all([
    getProductVariants(product.id),
    getProductReviews(product.id),
    getSession(),
  ]);
  const wishlisted = session ? (await getWishlistedIds(session.user.id)).has(product.id) : false;
  const defaultVariant = variants[0];
  const inStock = (defaultVariant?.stock ?? 0) > 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images ?? []} title={product.title} />

        {/* Info */}
        <div>
          {product.brand ? <p className="text-sm text-muted-foreground">{product.brand}</p> : null}
          <h1 className="text-3xl font-bold">{product.title}</h1>
          {product.rating_count > 0 ? (
            <StarRating value={product.rating_avg} count={product.rating_count} className="mt-2" />
          ) : null}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatINR(product.base_price)}</span>
            {product.compare_at_price && product.compare_at_price > product.base_price ? (
              <span className="text-lg text-muted-foreground line-through">{formatINR(product.compare_at_price)}</span>
            ) : null}
            {product.unit ? <span className="text-muted-foreground">/ {product.unit}</span> : null}
          </div>

          {product.description ? (
            <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
          ) : null}

          <div className="mt-4">
            {inStock ? (
              <Badge variant="success">In stock</Badge>
            ) : (
              <Badge variant="destructive">Out of stock</Badge>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {defaultVariant && inStock ? (
              <AddToCartButton variantId={defaultVariant.id} />
            ) : (
              <Button size="lg" disabled className="w-full sm:w-auto">Out of stock</Button>
            )}
            <WishlistButton productId={product.id} initial={wishlisted} variant="full" />
            {session ? <TrackPricePopover productId={product.id} currentPrice={product.base_price} /> : null}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Ratings & Reviews</h2>
        <div className="mt-4">
          <ReviewList reviews={reviews} avg={product.rating_avg} count={product.rating_count} />
        </div>
      </section>
    </main>
  );
}
