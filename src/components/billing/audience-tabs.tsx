"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Building2, Users, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const AUDIENCES = [
  { value: "architect", label: "Architect", icon: Building2 },
  { value: "engineer", label: "Consultant", icon: Users },
  { value: "contractor", label: "Builder", icon: Zap },
  { value: "supplier", label: "Supplier", icon: ShieldCheck },
];

export function AudienceTabs({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {AUDIENCES.map((a) => (
        <button
          key={a.value}
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.set("for", a.value);
            router.push(`${pathname}?${next.toString()}`);
          }}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            active === a.value
              ? "border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
              : "bg-card hover:bg-muted"
          )}
        >
          <a.icon className="h-4 w-4" /> {a.label}
        </button>
      ))}
    </div>
  );
}
