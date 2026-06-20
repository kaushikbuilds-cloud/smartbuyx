"use client";

import { useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setDefaultAddress, deleteAddress } from "@/features/account/address-actions";

export function AddressRowActions({ id, isDefault }: { id: string; isDefault: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-1">
      {!isDefault ? (
        <Button variant="ghost" size="sm" disabled={pending}
          onClick={() => startTransition(() => setDefaultAddress(id).then(() => {}))}>
          <Star className="h-3.5 w-3.5" /> Set default
        </Button>
      ) : null}
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending}
        onClick={() => startTransition(() => deleteAddress(id).then(() => {}))}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
