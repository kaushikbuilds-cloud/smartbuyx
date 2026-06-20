"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { addReview, type ActionState } from "@/features/catalog/actions";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addReview, null);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);

  return (
    <form action={action} className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Rate this product</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const v = i + 1;
          return (
            <button
              key={v}
              type="button"
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(v)}
            >
              <Star className={cn("h-6 w-6", v <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
            </button>
          );
        })}
      </div>
      <Input name="title" placeholder="Title (optional)" />
      <textarea name="comment" rows={3} placeholder="Share your experience..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient" size="sm">Submit review</SubmitButton>
    </form>
  );
}
