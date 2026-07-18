import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { OnboardingStatus } from "@/features/seller/verification";
import { Card, CardContent } from "@/components/ui/card";

type Step = { done: boolean; label: string; href: string };

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const steps: Step[] = [
    { done: status.hasLogo, label: "Add your store logo", href: "/dashboard/supplier/verification" },
    { done: status.hasProduct, label: "List your first product", href: "/dashboard/supplier/products/new" },
    { done: status.hasPayout, label: "Add payout (bank) details", href: "/dashboard/supplier/verification" },
    { done: status.kycSubmitted, label: "Upload KYC documents", href: "/dashboard/supplier/verification" },
    { done: status.gstVerified, label: "Get GST verified", href: "/dashboard/supplier/verification" },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null; // fully set up — hide the checklist

  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <Card className="border-purple-200 dark:border-purple-900/40">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Finish setting up your store</h2>
            <p className="text-xs text-muted-foreground">{doneCount} of {steps.length} done</p>
          </div>
          <span className="text-sm font-semibold text-purple-600">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" style={{ width: `${pct}%` }} />
        </div>
        <ul className="space-y-1.5">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                {s.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
