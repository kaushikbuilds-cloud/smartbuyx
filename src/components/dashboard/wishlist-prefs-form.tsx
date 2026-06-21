"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { updateWishlistVisibility, type PrefsActionState } from "@/features/account/preferences";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/submit-button";

export function WishlistPrefsForm({
  initialPublic,
  shareUrl,
}: {
  initialPublic: boolean;
  shareUrl: string;
}) {
  const [state, action] = useActionState<PrefsActionState, FormData>(updateWishlistVisibility, null);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <form action={action} className="space-y-4">
      <Switch
        name="wishlist_public"
        label="Public wishlist"
        description="Anyone with the link below can view your wishlist."
        defaultChecked={initialPublic}
      />

      <div>
        <p className="mb-2 text-sm font-medium">Share link</p>
        <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3">
          <span className="flex-1 truncate text-sm">{shareUrl}</span>
          <Button type="button" size="sm" variant="outline" onClick={copy}>
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Only resolves if your wishlist is public.</p>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save</SubmitButton>
    </form>
  );
}
