import Link from "next/link";
import Image from "next/image";
import { ImageOff, Star } from "lucide-react";
import { formatINR } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import type { AssistantProduct } from "@/features/ai/catalog-tool";

// Compact product card used by every AI feature that surfaces catalog
// results inline (assistant chat, gift finder, shopping planner).
export function AssistantProductCard({ product }: { product: AssistantProduct }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="flex items-center gap-3 p-2.5 transition-shadow hover:shadow-md">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.image ? (
            <Image src={product.image} alt={product.title} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{product.title}</p>
          <p className="text-xs font-bold">
            {formatINR(product.price)}
            {product.unit ? <span className="font-normal text-muted-foreground"> / {product.unit}</span> : null}
          </p>
          {product.ratingCount > 0 ? (
            <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)} ({product.ratingCount})
            </p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
