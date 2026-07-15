"use client";

import { useActionState } from "react";
import { publishReel, type CreatorActionState } from "@/features/creator/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function PublishReelForm() {
  const [state, action] = useActionState<CreatorActionState, FormData>(publishReel, null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input id="videoUrl" name="videoUrl" type="url" required placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Unboxing my new setup" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
          <Input id="thumbnailUrl" name="thumbnailUrl" type="url" placeholder="Optional" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="caption">Caption</Label>
        <textarea id="caption" name="caption" rows={2} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="What's this reel about?" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="productSlug">Tag a product (slug, optional)</Label>
        <Input id="productSlug" name="productSlug" placeholder="e.g. ultratech-cement-abc12" />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Publish reel</SubmitButton>
    </form>
  );
}
