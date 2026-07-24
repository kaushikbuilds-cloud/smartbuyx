"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageUploader } from "./image-uploader";
import { QC_LABELS } from "@/features/refurbished/types";
import type { RefurbishedEditData } from "@/features/refurbished/queries";
import type { ActionState } from "@/features/refurbished/actions";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  product?: RefurbishedEditData;
  submitLabel?: string;
};

export function RefurbishedForm({ action, product, submitLabel = "Save listing" }: Props) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {product ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <span>Quality inspection:</span>
          <Badge variant={product.qc_status === "passed" ? "success" : product.qc_status === "failed" ? "destructive" : "secondary"}>
            {QC_LABELS[product.qc_status]}
          </Badge>
          {product.qc_notes ? <span className="text-xs text-muted-foreground">— {product.qc_notes}</span> : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={product?.title} required placeholder="e.g. Apple iPhone 12, 128GB, Refurbished" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} placeholder="Apple, Samsung, Dell..." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="conditionGrade">Cosmetic condition</Label>
          <select id="conditionGrade" name="conditionGrade" defaultValue={product?.condition_grade ?? ""}
            required className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="" disabled>Select…</option>
            <option value="excellent">Excellent</option>
            <option value="very_good">Very Good</option>
            <option value="good">Good</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="basePrice">Price (₹)</Label>
          <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" defaultValue={product?.base_price} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compareAtPrice">Original MRP (₹)</Label>
          <Input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" min="0"
            defaultValue={product?.compare_at_price ?? ""} placeholder="optional" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="batteryHealth">Battery health (%)</Label>
          <Input id="batteryHealth" name="batteryHealth" type="number" min="0" max="100"
            defaultValue={product?.battery_health ?? ""} placeholder="if applicable" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="warrantyMonths">Warranty (months)</Label>
          <Input id="warrantyMonths" name="warrantyMonths" type="number" min="0" defaultValue={product?.warranty_months ?? 0} />
        </div>
        {product ? null : (
          <div className="grid gap-2">
            <Label htmlFor="stock">Opening stock</Label>
            <Input id="stock" name="stock" type="number" min="0" defaultValue={0} />
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="serialOrImei">Serial number / IMEI</Label>
        <Input id="serialOrImei" name="serialOrImei" defaultValue={product?.serial_or_imei ?? ""} required placeholder="Never shown to customers — used for our internal verification" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="accessoriesIncluded">Accessories included</Label>
        <Input id="accessoriesIncluded" name="accessoriesIncluded" defaultValue={product?.accessories_included ?? ""}
          placeholder="e.g. Charger, box, original cable" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Condition notes / description</Label>
        <textarea id="description" name="description" defaultValue={product?.description ?? ""}
          rows={4} className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Any scratches, dents, screen condition, repair history..." />
      </div>

      <div className="grid gap-2">
        <Label>Photos</Label>
        <ImageUploader initial={(product?.images ?? []).map((i) => i.url)} />
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <p className="text-xs text-muted-foreground">
        Every refurbished listing must pass a quality inspection before it's visible to shoppers.
      </p>
      <SubmitButton variant="gradient">{submitLabel}</SubmitButton>
    </form>
  );
}
