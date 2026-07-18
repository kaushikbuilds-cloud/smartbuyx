"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, Store, ShoppingBag, ShieldAlert, ShieldCheck, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/products", label: "Products", icon: Package },
  { href: "/dashboard/admin/suppliers", label: "Suppliers & Applications", icon: Store },
  { href: "/dashboard/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/admin/fraud", label: "Fraud Monitoring", icon: ShieldAlert },
];

const SUPERADMIN_NAV = [
  { href: "/dashboard/admin/admins", label: "Admins", icon: ShieldCheck },
  { href: "/dashboard/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function AdminNav({ isSuperadmin }: { isSuperadmin: boolean }) {
  const pathname = usePathname();
  const items = isSuperadmin ? [...NAV, ...SUPERADMIN_NAV] : NAV;
  return (
    <nav className="sticky top-4 w-full shrink-0 lg:w-56">
      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
