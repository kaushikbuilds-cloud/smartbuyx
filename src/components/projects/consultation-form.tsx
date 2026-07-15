"use client";

import { useActionState } from "react";
import { requestConsultation, type ConsultationActionState } from "@/features/consultations/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function ConsultationForm({ proId, proRole }: { proId: string; proRole: string }) {
  const [state, action] = useActionState<ConsultationActionState, FormData>(requestConsultation, null);
  const minDateTime = new Date(Date.now() + 3600_000).toISOString().slice(0, 16);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="proId" value={proId} />
      <input type="hidden" name="proRole" value={proRole} />

      <div className="grid gap-2">
        <Label htmlFor="scheduledAt">Date &amp; time</Label>
        <Input id="scheduledAt" name="scheduledAt" type="datetime-local" min={minDateTime} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="mode">Mode</Label>
        <select id="mode" name="mode" defaultValue="video" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="video">Video call</option>
          <option value="in_person">In person</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="What would you like to discuss?"
        />
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Request consultation</SubmitButton>
    </form>
  );
}
