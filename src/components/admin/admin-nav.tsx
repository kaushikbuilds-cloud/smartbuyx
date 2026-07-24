"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, Store, ShoppingBag, ShieldAlert, ShieldCheck, ScrollText, FileCheck2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/products", label: "Products", icon: Package },
  { href: "/dashboard/admin/suppliers", label: "Suppliers & Applications", icon: Store },
  { href: "/dashboard/admin/kyc", label: "KYC Review", icon: FileCheck2 },
  { href: "/dashboard/admin/refurbished-qc", label: "Refurbished QC", icon: RefreshCw },
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
    <nav className="w-full shrink-0 lg:sticky lg:top-4 lg:w-56">
      <p className="mb-3 hidden px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">Admin</p>
      {/* Horizontal scrolling tab bar on mobile so it doesn't push the page
          content down; a normal vertical sidebar from lg up. */}
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:space-y-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:gap-3",
                  active
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
