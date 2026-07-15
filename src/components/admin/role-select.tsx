"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setUserRole } from "@/features/admin/actions";
import type { UserRole } from "@/types/auth";

const ROLES: UserRole[] = [
  "customer", "supplier", "d2c_brand", "architect", "engineer",
  "contractor", "interior_designer", "creator", "admin", "superadmin",
];

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as UserRole;
        startTransition(async () => {
          await setUserRole(userId, next);
          toast.success(`Role set to ${next}`);
        });
      }}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
