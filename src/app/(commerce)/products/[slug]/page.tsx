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
import { getReviewSummary } from "@/features/ai/review-summary";
import { ReviewSummaryCard } from "@/components/shop/review-summary-card";
import { SizeRecommendationWidget } from "@/components/shop/size-recommendation-widget";
import { getPriceTrend } from "@/features/catalog/price-trend";
import { PriceTrendBadge } from "@/components/shop/price-trend-badge";
import { ArModelViewer } from "@/components/shop/ar-model-viewer";
import { getRefurbishedDetails } from "@/features/refurbished/queries";
import { RefurbishedConditionCard } from "@/components/shop/refurbished-condition-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };

  const description =
    product.description?.slice(0, 160) ??
    `${product.title}${product.brand ? ` by ${product.brand}` : ""} — buy online on SmartBuyX.`;
  const image = (product.images as unknown as { url: string }[] | null)?.[0]?.url;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: product.title,
      description,
      url: `/products/${slug}`,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [variants, reviews, session, reviewSummary, priceTrend, refurbishedDetails] = await Promise.all([
    getProductVariants(product.id),
    getProductReviews(product.id),
    getSession(),
    getReviewSummary(product.id, product.rating_count),
    getPriceTrend(product.id, product.base_price),
    product.is_refurbished ? getRefurbishedDetails(product.id) : Promise.resolve(null),
  ]);
  const wishlisted = session ? (await getWishlistedIds(session.user.id)).has(product.id) : false;
  const defaultVariant = variants[0];
  const inStock = (defaultVariant?.stock ?? 0) > 0;

  const productImages = (product.images as unknown as { url: string }[] | null) ?? [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: productImages.map((i) => i.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: `https://smartbuyx.in/products/${slug}`,
      priceCurrency: "INR",
      price: product.base_price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.rating_count > 0
        ? { "@type": "AggregateRating", ratingValue: product.rating_avg, reviewCount: product.rating_count }
        : undefined,
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <ProductGallery images={product.images ?? []} title={product.title} />
          {product.model_glb_url ? (
            <ArModelViewer
              glbUrl={product.model_glb_url}
              usdzUrl={product.model_usdz_url}
              title={product.title}
              posterUrl={product.images?.[0]?.url}
            />
          ) : null}
        </div>

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
          <div className="mt-1.5"><PriceTrendBadge trend={priceTrend} /></div>

          {refurbishedDetails ? (
            <div className="mt-4">
              <RefurbishedConditionCard details={refurbishedDetails} />
            </div>
          ) : null}

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

          {session && (product.attributes as Record<string, unknown> | null)?.size_chart ? (
            <div className="mt-4">
              <SizeRecommendationWidget productId={product.id} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Ratings & Reviews</h2>
        {reviewSummary ? (
          <div className="mt-4">
            <ReviewSummaryCard summary={reviewSummary} />
          </div>
        ) : null}
        <div className="mt-4">
          <ReviewList reviews={reviews} avg={product.rating_avg} count={product.rating_count} />
        </div>
      </section>
    </main>
  );
}
