"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, MapPin, Loader2 } from "lucide-react";
import { matchSuppliers, type SupplierMatch } from "@/features/ai/supplier-match";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustScoreBadge } from "@/components/shop/trust-score-badge";

export function SupplierMatchmaker({ defaultPincode }: { defaultPincode?: string | null }) {
  const [need, setNeed] = useState("");
  const [budget, setBudget] = useState("");
  const [pincode, setPincode] = useState(defaultPincode ?? "");
  const [matches, setMatches] = useState<SupplierMatch[] | null>(null);
  const [by, setBy] = useState<"ai" | "heuristic">("heuristic");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!need.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await matchSuppliers({
        need: need.trim(),
        budget: budget ? Number(budget) : undefined,
        pincode: pincode.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        setMatches(null);
        return;
      }
      setMatches(res.matches);
      setBy(res.by);
    });
  }

  return (
    <Card className="border-purple-200 bg-purple-50/40 dark:border-purple-900 dark:bg-purple-950/20">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">AI Supplier Matchmaking</p>
            <p className="text-xs text-muted-foreground">Describe your need — we&apos;ll recommend the best-fit suppliers.</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
          <Input
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. 500 bags of 53-grade cement"
          />
          <Input
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
            placeholder="Budget ₹"
            inputMode="numeric"
          />
          <Input
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Pincode"
            inputMode="numeric"
          />
          <Button variant="gradient" onClick={run} disabled={pending || !need.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Match"}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {matches ? (
          matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suppliers matched yet — try broadening your need or pincode.</p>
          ) : (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                Top {matches.length} matches
                <Badge variant="secondary" className="text-[10px]">{by === "ai" ? "AI-ranked" : "Best fit"}</Badge>
              </p>
              {matches.map((m) => (
                <Link key={m.userId} href={`/suppliers/${m.userId}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium">
                          {m.businessName}
                          {m.isLocal ? (
                            <Badge variant="secondary" className="gap-1 text-[10px]"><MapPin className="h-2.5 w-2.5" /> Local</Badge>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{m.reason}</p>
                      </div>
                      <TrustScoreBadge score={m.trustScore} size="sm" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
