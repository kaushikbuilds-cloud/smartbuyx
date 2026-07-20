"use client";

import { useState, useTransition } from "react";
import { Ruler, Loader2, Sparkles } from "lucide-react";
import { recommendSize } from "@/features/ai/size-recommendation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SizeRecommendationWidget({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [usualSize, setUsualSize] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ size: string; reasoning: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await recommendSize({
        productId,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        usualSize: usualSize || undefined,
      });
      if (res.ok) setResult({ size: res.size, reasoning: res.reasoning });
      else setError(res.error);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:underline"
      >
        <Ruler className="h-4 w-4" /> Find my size
      </button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Ruler className="h-4 w-4 text-purple-600" /> Find my size
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label htmlFor="heightCm" className="text-xs">Height (cm)</Label>
          <Input id="heightCm" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="170" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="weightKg" className="text-xs">Weight (kg)</Label>
          <Input id="weightKg" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="65" />
        </div>
      </div>
      <div className="mt-3 grid gap-1">
        <Label htmlFor="usualSize" className="text-xs">Usual size elsewhere (optional)</Label>
        <Input id="usualSize" value={usualSize} onChange={(e) => setUsualSize(e.target.value)} placeholder="e.g. US 8, Medium in H&amp;M" />
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <Button onClick={submit} disabled={pending} variant="gradient" size="sm" className="mt-3 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Recommend my size
      </Button>

      {result ? (
        <div className="mt-3 rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Recommended size: {result.size}</p>
          {result.reasoning ? <p className="mt-1 text-xs text-muted-foreground">{result.reasoning}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
