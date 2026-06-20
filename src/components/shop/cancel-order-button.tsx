"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/features/orders/order-actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cancel order
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Reason (optional)"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await cancelOrder(orderId, reason);
              if (res.error) toast.error(res.error);
              else {
                toast.success("Order cancelled. Refund credited to wallet if paid.");
                router.refresh();
              }
            })
          }
        >
          Confirm cancel
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Keep order</Button>
      </div>
    </div>
  );
}
