"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/orders/cart-actions";

export function AddToCartButton({ variantId }: { variantId: string }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function onAdd() {
    startTransition(async () => {
      const res = await addToCart(variantId, 1);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setAdded(true);
      toast.success("Added to cart");
      setTimeout(() => setAdded(false), 2000);
    });
  }

  return (
    <Button size="lg" variant="gradient" onClick={onAdd} disabled={pending} className="w-full sm:w-auto">
      {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
      {added ? "Added" : "Add to cart"}
    </Button>
  );
}
