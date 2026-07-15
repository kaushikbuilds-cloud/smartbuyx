"use client";

import { useActionState } from "react";
import { addSiteReport, type ProjectActionState } from "@/features/projects/actions";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function ReportForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState<ProjectActionState, FormData>(addSiteReport, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-1.5">
        <Label htmlFor="kind" className="text-xs">Report type</Label>
        <select id="kind" name="kind" className="h-9 w-40 rounded-md border border-input bg-background px-2 text-sm">
          <option value="progress">Progress</option>
          <option value="inspection">Inspection</option>
          <option value="issue">Issue</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="body" className="text-xs">Details</Label>
        <textarea
          id="body"
          name="body"
          required
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="What's happening on site..."
        />
      </div>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
      <SubmitButton size="sm" variant="gradient">Post update</SubmitButton>
    </form>
  );
}
