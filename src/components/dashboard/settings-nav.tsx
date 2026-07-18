"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, MapPin, CreditCard, BellRing, Shield, Globe, Heart, Coins, Package, Sparkles, LifeBuoy, Settings as Gear,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SECTIONS = [
  { href: "/dashboard/customer/settings/account", label: "Account", icon: User },
  { href: "/dashboard/customer/settings/addresses", label: "Addresses", icon: MapPin },
  { href: "/dashboard/customer/settings/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/customer/settings/notifications", label: "Notifications", icon: BellRing },
  { href: "/dashboard/customer/settings/security", label: "Security", icon: Shield },
  { href: "/dashboard/customer/settings/preferences", label: "Preferences", icon: Globe },
  { href: "/dashboard/customer/settings/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/customer/settings/rewards", label: "Rewards", icon: Coins },
  { href: "/dashboard/customer/settings/orders", label: "Orders", icon: Package },
  { href: "/dashboard/customer/settings/ai", label: "AI Preferences", icon: Sparkles },
  { href: "/dashboard/customer/settings/support", label: "Support", icon: LifeBuoy },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="w-full shrink-0 lg:sticky lg:top-4 lg:w-60">
      <div className="mb-3 flex items-center gap-2 px-2">
        <Gear className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-muted-foreground">Settings</p>
      </div>
      <ul className="space-y-0.5">
        {SECTIONS.map((s) => {
          const active = pathname === s.href || pathname.startsWith(s.href + "/");
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <s.icon className="h-4 w-4 shrink-0" />
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
