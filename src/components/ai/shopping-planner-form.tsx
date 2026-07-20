"use client";

import { useState, useTransition } from "react";
import { ClipboardList, Loader2, Sparkles } from "lucide-react";
import { planShopping, type PlanCategory } from "@/features/ai/shopping-planner";
import { AssistantProductCard } from "./assistant-product-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/format";

const EXAMPLES = ["Diwali home decor & gifting under ₹15000", "New home setup under ₹50000", "Monsoon essentials under ₹5000"];

export function ShoppingPlannerForm() {
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState(10000);
  const [pending, startTransition] = useTransition();
  const [categories, setCategories] = useState<PlanCategory[] | null>(null);
  const [allocated, setAllocated] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    setCategories(null);
    startTransition(async () => {
      const res = await planShopping(goal, budget);
      if (res.ok) {
        setCategories(res.categories);
        setAllocated(res.allocated);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-2">
            <Label htmlFor="goal">What are you shopping for?</Label>
            <Input
              id="goal"
              placeholder="e.g. Diwali home decor and gifting"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setGoal(ex)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget">Total budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min={1}
              value={budget || ""}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button onClick={submit} disabled={pending} variant="gradient" className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
            Build my plan
          </Button>
        </CardContent>
      </Card>

      {categories ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-purple-600">
              <Sparkles className="h-4 w-4" /> Your plan
            </p>
            <p className="text-sm text-muted-foreground">
              Allocated {formatINR(allocated)} of {formatINR(budget)}
            </p>
          </div>

          {categories.map((c) => (
            <Card key={c.category}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.category}</h3>
                    <Badge variant="secondary">{formatINR(c.budget)}</Badge>
                  </div>
                </div>
                {c.note ? <p className="text-xs text-muted-foreground">{c.note}</p> : null}
                {c.products.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {c.products.map((p) => <AssistantProductCard key={p.id} product={p} />)}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No matching items in the catalog yet for this category.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
