"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setUserRole } from "@/features/admin/actions";
import type { UserRole } from "@/types/auth";

const BASE_ROLES: UserRole[] = [
  "customer", "supplier", "d2c_brand", "architect", "engineer",
  "contractor", "interior_designer", "creator",
];
const ADMIN_TIER: UserRole[] = ["admin", "superadmin"];

export function RoleSelect({
  userId,
  role,
  viewerRole,
}: {
  userId: string;
  role: string;
  viewerRole: UserRole;
}) {
  const [pending, startTransition] = useTransition();
  // Only superadmin can grant/revoke admin-tier access — a regular admin
  // doesn't even see those options, since attempting one would just error.
  const isSuperadmin = viewerRole === "superadmin";
  const options = isSuperadmin ? [...BASE_ROLES, ...ADMIN_TIER] : BASE_ROLES;
  const currentIsAdminTier = ADMIN_TIER.includes(role as UserRole);

  if (currentIsAdminTier && !isSuperadmin) {
    return <span className="text-xs text-muted-foreground capitalize">{role} (superadmin only)</span>;
  }

  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as UserRole;
        startTransition(async () => {
          const res = await setUserRole(userId, next);
          if (res?.error) {
            toast.error(res.error);
            return;
          }
          toast.success(`Role set to ${next}`);
        });
      }}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
    >
      {options.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
