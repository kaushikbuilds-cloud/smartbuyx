"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { ImageOff, Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/orders/cart-actions";
import { toggleWishlist } from "@/features/catalog/wishlist-actions";
import type { Product } from "@/features/catalog/types";

type VariantMap = Record<string, string>;

export function RecommendedRow({
  products,
  defaultVariantByProduct,
  wishlisted,
  title = "Recommended For You",
}: {
  products: Product[];
  defaultVariantByProduct?: VariantMap;
  wishlisted?: Set<string>;
  title?: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href="/products" className="text-sm text-primary hover:underline">View All</Link>
      </div>

      {products.length === 0 ? (
        <Card className="flex items-center justify-center p-8 text-sm text-muted-foreground">
          No products yet — sellers haven&apos;t posted any listings.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <ProductCardCompact
              key={p.id}
              product={p}
              variantId={defaultVariantByProduct?.[p.id]}
              initiallyWishlisted={wishlisted?.has(p.id) ?? false}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCardCompact({
  product,
  variantId,
  initiallyWishlisted,
}: {
  product: Product;
  variantId?: string;
  initiallyWishlisted: boolean;
}) {
  const [wished, setWished] = useState(initiallyWishlisted);
  const [pending, startTransition] = useTransition();
  const img = product.images?.[0]?.url;
  const discount =
    product.compare_at_price && product.compare_at_price > product.base_price
      ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
      : 0;

  function add() {
    if (!variantId) {
      toast.error("Select options on the product page first.");
      return;
    }
    startTransition(async () => {
      const res = await addToCart(variantId, 1);
      if (res?.error) toast.error(res.error);
      else toast.success("Added to cart");
    });
  }

  function wish() {
    startTransition(async () => {
      const res = await toggleWishlist(product.id);
      if (res.error) toast.error(res.error);
      else setWished(res.wishlisted);
    });
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="group">
        <div className="relative aspect-square bg-muted">
          {img ? (
            <Image src={img} alt={product.title} fill sizes="200px" className="object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          {discount > 0 ? (
            <span className="absolute left-2 top-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {discount}% OFF
            </span>
          ) : null}
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold">{formatINR(product.base_price)}</span>
            {product.compare_at_price && product.compare_at_price > product.base_price ? (
              <span className="text-xs text-muted-foreground line-through">{formatINR(product.compare_at_price)}</span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="flex gap-1 border-t p-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={add} disabled={pending}>
          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={wish} disabled={pending} aria-label="Wishlist">
          <Heart className={cn("h-4 w-4", wished && "fill-rose-500 text-rose-500")} />
        </Button>
      </div>
    </Card>
  );
}
