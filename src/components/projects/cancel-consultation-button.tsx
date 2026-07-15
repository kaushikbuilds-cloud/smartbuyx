"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelConsultation } from "@/features/consultations/actions";

export function CancelConsultationButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await cancelConsultation(id);
          toast.success("Cancelled");
        })
      }
    >
      Cancel
    </Button>
  );
}
