import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import type { Product } from "@/features/catalog/types";

export function ProductCard({ product, wishlisted }: { product: Product; wishlisted?: boolean }) {
  const img = product.images?.[0]?.url;
  const discount =
    product.compare_at_price && product.compare_at_price > product.base_price
      ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
      : null;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <WishlistButton productId={product.id} initial={wishlisted} />
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-10 w-10" />
            </div>
          )}
          {discount ? (
            <Badge variant="destructive" className="absolute left-2 top-2">{discount}% OFF</Badge>
          ) : null}
        </div>
        <CardContent className="p-3">
          {product.brand ? (
            <p className="truncate text-xs text-muted-foreground">{product.brand}</p>
          ) : null}
          <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-semibold">{formatINR(product.base_price)}</span>
            {product.compare_at_price && product.compare_at_price > product.base_price ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatINR(product.compare_at_price)}
              </span>
            ) : null}
            {product.unit ? <span className="text-xs text-muted-foreground">/ {product.unit}</span> : null}
          </div>
          {product.rating_count > 0 ? (
            <StarRating value={product.rating_avg} count={product.rating_count} className="mt-1.5" />
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
