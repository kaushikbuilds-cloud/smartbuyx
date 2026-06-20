"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Minus, Plus, Trash2, ImageOff } from "lucide-react";
import { formatINR } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { updateCartItem, removeCartItem } from "@/features/orders/cart-actions";
import type { CartLine } from "@/features/orders/cart-queries";

export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();

  const setQty = (q: number) => startTransition(() => updateCartItem(line.itemId, q).then(() => {}));
  const remove = () => startTransition(() => removeCartItem(line.itemId).then(() => {}));

  return (
    <div className="flex items-center gap-4 border-b py-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {line.image ? (
          <Image src={line.image} alt={line.title} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link href={`/products/${line.slug}`} className="line-clamp-2 font-medium hover:underline">
          {line.title}
        </Link>
        <p className="text-sm text-muted-foreground">{formatINR(line.unitPrice)} each</p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={pending} onClick={() => setQty(line.quantity - 1)}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm">{line.quantity}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={pending} onClick={() => setQty(line.quantity + 1)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="w-24 text-right font-semibold">{formatINR(line.unitPrice * line.quantity)}</div>

      <Button variant="ghost" size="icon" disabled={pending} onClick={remove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
