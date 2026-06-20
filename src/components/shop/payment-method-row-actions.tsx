"use client";

import { useTransition } from "react";
import { Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePaymentMethod, setDefaultPaymentMethod } from "@/features/account/payment-methods";

export function PaymentMethodRowActions({ id, isDefault }: { id: string; isDefault: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-1">
      {isDefault ? null : (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setDefaultPaymentMethod(id);
              toast.success("Default updated");
            })
          }
        >
          <Star className="h-4 w-4" /> Default
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deletePaymentMethod(id);
            toast.success("Removed");
          })
        }
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
