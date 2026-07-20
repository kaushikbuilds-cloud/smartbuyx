"use client";

import { useState, useTransition } from "react";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { findGifts, type GiftFinderInput } from "@/features/ai/gift-finder";
import type { AssistantProduct } from "@/features/ai/catalog-tool";
import { AssistantProductCard } from "./assistant-product-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const OCCASIONS = ["Birthday", "Diwali", "Anniversary", "Wedding", "Housewarming", "Just because"];

export function GiftFinderForm() {
  const [form, setForm] = useState<GiftFinderInput>({ recipient: "", occasion: "", budget: 1000, interests: "" });
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ answer: string; products: AssistantProduct[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await findGifts(form);
      if (res.ok) setResult({ answer: res.answer, products: res.products });
      else setError(res.error);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-2">
            <Label htmlFor="recipient">Who's it for?</Label>
            <Input
              id="recipient"
              placeholder="e.g. my mom, a colleague, my 8-year-old nephew"
              value={form.recipient}
              onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="occasion">Occasion</Label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, occasion: o }))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.occasion === o ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "hover:bg-muted"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or type your own occasion"
              value={form.occasion}
              onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min={1}
              value={form.budget || ""}
              onChange={(e) => setForm((f) => ({ ...f, budget: Number(e.target.value) }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interests">Interests (optional)</Label>
            <Input
              id="interests"
              placeholder="e.g. loves cooking, into fitness, tech gadgets"
              value={form.interests}
              onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button onClick={submit} disabled={pending} variant="gradient" className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            Find gift ideas
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-600">
              <Sparkles className="h-4 w-4" /> Ideas for you
            </div>
            <p className="whitespace-pre-line text-sm">{result.answer}</p>
            {result.products.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {result.products.map((p) => <AssistantProductCard key={p.id} product={p} />)}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
