"use client";

import { useActionState } from "react";
import { addExpense, type ProjectActionState } from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

const CATEGORIES = ["material", "labour", "transport", "equipment", "permits", "misc"];

export function ExpenseForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState<ProjectActionState, FormData>(addExpense, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-1.5">
        <Label htmlFor="category" className="text-xs">Category</Label>
        <select id="category" name="category" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="amount" className="text-xs">Amount (₹)</Label>
        <Input id="amount" name="amount" type="number" min={1} required className="h-9" />
      </div>
      <div className="grid gap-1.5 sm:col-span-1.5">
        <Label htmlFor="description" className="text-xs">Note</Label>
        <Input id="description" name="description" placeholder="Optional" className="h-9" />
      </div>
      <div className="flex items-end">
        <SubmitButton size="sm" variant="outline" className="w-full">Log expense</SubmitButton>
      </div>
      {state?.error ? <p className="text-xs text-destructive sm:col-span-4">{state.error}</p> : null}
    </form>
  );
}
