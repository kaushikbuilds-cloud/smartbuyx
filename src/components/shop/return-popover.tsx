"use client";

import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReturnForm } from "./return-form";

export function ReturnPopover({ orderItemId }: { orderItemId: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" /> Request return
      </Button>
    );
  }
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Request a return</p>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
      </div>
      <ReturnForm orderItemId={orderItemId} />
    </div>
  );
}
