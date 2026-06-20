"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/features/catalog/wishlist-actions";

export function WishlistButton({
  productId,
  initial = false,
  variant = "icon",
}: {
  productId: string;
  initial?: boolean;
  variant?: "icon" | "full";
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleWishlist(productId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setOn(res.wishlisted);
    });
  }

  if (variant === "full") {
    return (
      <Button variant="outline" size="lg" onClick={toggle} disabled={pending}>
        <Heart className={cn("h-5 w-5", on && "fill-rose-500 text-rose-500")} />
        {on ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label="Toggle wishlist"
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
    >
      <Heart className={cn("h-4 w-4", on && "fill-rose-500 text-rose-500")} />
    </button>
  );
}
