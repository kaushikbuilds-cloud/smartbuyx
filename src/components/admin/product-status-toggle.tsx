"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setProductStatus } from "@/features/admin/actions";

export function ProductStatusToggle({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const archived = status === "archived";
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setProductStatus(id, archived ? "active" : "archived");
          toast.success(archived ? "Product restored" : "Product archived");
        })
      }
    >
      {archived ? "Restore" : "Archive"}
    </Button>
  );
}
