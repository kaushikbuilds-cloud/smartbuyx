"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewRefurbishedQc } from "@/features/admin/actions";

export function RefurbishedQcActions({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();

  function pass() {
    startTransition(async () => {
      await reviewRefurbishedQc(productId, "passed");
      toast.success("Marked as passed inspection");
    });
  }

  function fail() {
    const notes = window.prompt("What failed inspection? (shown to the seller)");
    if (notes === null) return;
    startTransition(async () => {
      await reviewRefurbishedQc(productId, "failed", notes);
      toast.success("Marked as failed inspection");
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="gradient" disabled={pending} onClick={pass}>
        <Check className="h-4 w-4" /> Pass
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={fail}>
        <X className="h-4 w-4" /> Fail
      </Button>
    </div>
  );
}
