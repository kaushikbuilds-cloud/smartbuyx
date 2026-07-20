"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageUploader } from "./image-uploader";
import type { ActionState } from "@/features/catalog/actions";
import type { Product } from "@/features/catalog/types";

function existingSizeChart(product?: Product): string {
  const chart = (product?.attributes as Record<string, unknown> | undefined)?.size_chart as Record<string, number> | undefined;
  if (!chart) return "";
  return Object.entries(chart).map(([size, val]) => `${size}:${val}`).join(", ");
}

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  product?: Product;
  submitLabel?: string;
};

export function ProductForm({ action, product, submitLabel = "Save product" }: Props) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={product?.title} required placeholder="e.g. UltraTech Cement 50kg" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="kind">Type</Label>
          <select id="kind" name="kind" defaultValue={product?.kind ?? "product"}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="product">Product (D2C)</option>
            <option value="material">Construction material</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} placeholder="UltraTech" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="basePrice">Price (₹)</Label>
          <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0"
            defaultValue={product?.base_price} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compareAtPrice">MRP (₹)</Label>
          <Input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" min="0"
            defaultValue={product?.compare_at_price ?? ""} placeholder="optional" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" defaultValue={product?.unit ?? ""} placeholder="bag, kg, piece" />
        </div>
      </div>

      {product ? null : (
        <div className="grid w-40 gap-2">
          <Label htmlFor="stock">Opening stock</Label>
          <Input id="stock" name="stock" type="number" min="0" defaultValue={0} />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea id="description" name="description" defaultValue={product?.description ?? ""}
          rows={4} className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Describe the product..." />
      </div>

      <div className="grid gap-2">
        <Label>Images</Label>
        <ImageUploader initial={(product?.images ?? []).map((i) => i.url)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sizeChart">Size chart (optional, apparel only)</Label>
        <Input
          id="sizeChart"
          name="sizeChart"
          defaultValue={existingSizeChart(product)}
          placeholder="e.g. S:36, M:38, L:40, XL:42 (chest, inches)"
        />
        <p className="text-xs text-muted-foreground">
          Powers AI size recommendations for customers. Leave blank if this isn&apos;t apparel.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" defaultValue={product?.status ?? "active"}
          className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm">
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">{submitLabel}</SubmitButton>
    </form>
  );
}
