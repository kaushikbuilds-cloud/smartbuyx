"use client";

import { useActionState } from "react";
import { createProject, type ProjectActionState } from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

const STYLES = ["traditional", "modern", "contemporary", "minimal", "colonial", "industrial", "scandinavian", "vastu"];
const FACINGS = ["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"];

export function NewProjectForm() {
  const [state, action] = useActionState<ProjectActionState, FormData>(createProject, null);

  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="title">Project name</Label>
        <Input id="title" name="title" required placeholder="e.g. My Dream Home" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="plotSizeSqft">Plot size (sqft)</Label>
          <Input id="plotSizeSqft" name="plotSizeSqft" type="number" min={100} placeholder="1200" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="floors">Floors</Label>
          <Input id="floors" name="floors" type="number" min={1} max={20} defaultValue={1} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bhk">BHK</Label>
          <Input id="bhk" name="bhk" type="number" min={1} max={10} placeholder="3" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} placeholder="600001" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budget">Budget (₹)</Label>
          <Input id="budget" name="budget" type="number" min={0} placeholder="2500000" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="style">Style</Label>
          <select id="style" name="style" defaultValue="" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select style</option>
            {STYLES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="facing">Facing</Label>
          <select id="facing" name="facing" defaultValue="" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select facing</option>
            {FACINGS.map((f) => <option key={f} value={f}>{f.replace("_", "-")}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="vastuCompliant" className="h-4 w-4 accent-orange-600" />
        Vastu-compliant design required
      </label>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton variant="gradient">Create project</SubmitButton>
    </form>
  );
}
