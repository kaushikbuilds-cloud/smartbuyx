"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2, Sparkles, X } from "lucide-react";
import { searchByImage } from "@/features/ai/image-search";
import type { AssistantProduct } from "@/features/ai/catalog-tool";
import { AssistantProductCard } from "./assistant-product-card";
import { Card, CardContent } from "@/components/ui/card";

const MAX_BYTES = 4 * 1024 * 1024; // stay under the 5mb server action body limit

export function ImageSearchForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ detected: string; products: AssistantProduct[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Photo is too large — try a smaller image (under 4MB).");
      return;
    }
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      startTransition(async () => {
        const res = await searchByImage(dataUrl);
        if (res.ok) setResult({ detected: res.detected, products: res.products });
        else setError(res.error);
      });
    };
    reader.readAsDataURL(file);
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          {preview ? (
            <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-xl border">
              <Image src={preview} alt="Uploaded photo" fill className="object-cover" />
              <button
                type="button"
                onClick={reset}
                aria-label="Remove photo"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center hover:bg-muted">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                <Camera className="h-6 w-6" />
              </span>
              <div>
                <p className="font-medium">Upload or take a photo</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, or WebP · up to 4MB</p>
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
            </label>
          )}

          {pending ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Looking at your photo...
            </div>
          ) : null}

          {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-600">
              <Sparkles className="h-4 w-4" /> We think this is: {result.detected}
            </div>
            {result.products.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {result.products.map((p) => <AssistantProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No close matches in the catalog yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
