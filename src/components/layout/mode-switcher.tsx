"use client";

import { useTransition } from "react";
import { ShoppingBag, HardHat } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { setMode, type AppMode } from "@/features/preferences/mode";

export function ModeSwitcher({ mode }: { mode: AppMode }) {
  const [pending, startTransition] = useTransition();

  function pick(next: AppMode) {
    if (next === mode || pending) return;
    startTransition(() => setMode(next));
  }

  return (
    <div
      className={cn(
        "mx-3 mt-3 grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1 text-xs font-medium",
        pending && "opacity-60"
      )}
      role="tablist"
      aria-label="App mode"
    >
      <button
        role="tab"
        aria-selected={mode === "commerce"}
        onClick={() => pick("commerce")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 transition-colors",
          mode === "commerce"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        Shop
      </button>
      <button
        role="tab"
        aria-selected={mode === "build"}
        onClick={() => pick("build")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 transition-colors",
          mode === "build"
            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <HardHat className="h-3.5 w-3.5" />
        Build
      </button>
    </div>
  );
}
