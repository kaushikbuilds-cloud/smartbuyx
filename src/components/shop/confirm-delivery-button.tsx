"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmDelivery } from "@/features/orders/order-actions";

export function ConfirmDeliveryButton({ shipmentId }: { shipmentId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="gradient"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await confirmDelivery(shipmentId);
          if (res.error) toast.error(res.error);
          else {
            toast.success("Delivery confirmed. Payment released to seller.");
            router.refresh();
          }
        })
      }
    >
      <CheckCircle2 className="h-4 w-4" /> Confirm delivery
    </Button>
  );
}
