"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { setProductFeatured } from "@/features/admin/actions";

export function ProductFeaturedToggle({ id, featured }: { id: string; featured: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title={featured ? "Remove from homepage" : "Feature on homepage"}
      onClick={() =>
        startTransition(async () => {
          await setProductFeatured(id, !featured);
          toast.success(featured ? "Removed from featured" : "Featured on homepage");
        })
      }
      className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
    >
      <Star className={cn("h-4 w-4", featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
    </button>
  );
}
