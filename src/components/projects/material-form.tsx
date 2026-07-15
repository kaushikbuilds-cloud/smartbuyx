"use client";

import { useActionState } from "react";
import { addProjectMaterial, type ProjectActionState } from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function MaterialForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState<ProjectActionState, FormData>(addProjectMaterial, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-5">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="name" className="text-xs">Material</Label>
        <Input id="name" name="name" required placeholder="OPC 53 Cement" className="h-9" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="unit" className="text-xs">Unit</Label>
        <Input id="unit" name="unit" required placeholder="bags" className="h-9" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="plannedQty" className="text-xs">Planned qty</Label>
        <Input id="plannedQty" name="plannedQty" type="number" min={1} required className="h-9" />
      </div>
      <div className="flex items-end">
        <SubmitButton size="sm" variant="outline" className="w-full">Add</SubmitButton>
      </div>
      {state?.error ? <p className="text-xs text-destructive sm:col-span-5">{state.error}</p> : null}
    </form>
  );
}
