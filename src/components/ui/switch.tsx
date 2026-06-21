"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

// Simple checkbox-backed switch so it serializes in form submissions.
type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  description?: string;
};

export function Switch({ className, label, description, defaultChecked, ...props }: Props) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 py-2", className)}>
      <div className="min-w-0 flex-1">
        {label ? <p className="text-sm font-medium">{label}</p> : null}
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <span className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors has-[:checked]:bg-gradient-to-r has-[:checked]:from-purple-600 has-[:checked]:to-indigo-600">
        <input
          type="checkbox"
          className="peer sr-only"
          defaultChecked={defaultChecked}
          {...props}
        />
        <span className="ml-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
