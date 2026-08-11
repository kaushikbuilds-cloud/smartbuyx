"use client";

import Link from "next/link";
import { X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/format";

export type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  featureName: string;
  currentPlanName: string;
  requiredPlanName: string;
  requiredPlanPriceInr: number;
  audience: string;
  benefits?: string[];
};

// Self-contained (no extra dialog dependency) -- matches the rest of this
// project's minimal-dependency convention. Triggered wherever a
// canUseFeature() check fails client-side after an action returns a
// "not_subscribed" / "limit_reached" style error.
export function UpgradeModal({
  open, onClose, featureName, currentPlanName, requiredPlanName, requiredPlanPriceInr, audience, benefits,
}: UpgradeModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
            <Crown className="h-5 w-5" />
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="text-lg font-bold">Upgrade to unlock {featureName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {featureName} is available on the <span className="font-medium text-foreground">{requiredPlanName}</span> plan and above.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Your plan</span>
          <span className="font-medium">{currentPlanName}</span>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-purple-400 bg-purple-50 p-3 text-sm dark:bg-purple-950/20">
          <span>{requiredPlanName}</span>
          <span className="font-bold">{formatINR(requiredPlanPriceInr)}/mo</span>
        </div>
        {benefits && benefits.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {benefits.map((b) => <li key={b}>• {b}</li>)}
          </ul>
        ) : null}
        <Button variant="gradient" className="mt-4 w-full" asChild>
          <Link href={`/plans?for=${audience}`}>Upgrade Now</Link>
        </Button>
      </div>
    </div>
  );
}
