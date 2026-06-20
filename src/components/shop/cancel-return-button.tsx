"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelReturn } from "@/features/orders/returns";

export function CancelReturnButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await cancelReturn(id);
          toast.success("Return cancelled");
        })
      }
    >
      Cancel
    </Button>
  );
}
