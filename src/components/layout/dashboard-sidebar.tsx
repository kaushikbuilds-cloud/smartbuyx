"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Package, Heart, ShoppingCart, Bell, Ticket, MapPin, CreditCard,
  RotateCcw, Star, Coins, BellRing, LifeBuoy, Settings, Gift, ShoppingBag,
  HardHat, FolderKanban, FileText, Building2, Wrench, Sparkles, Ruler, Boxes, ScrollText, ClipboardList, Store,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ModeSwitcher } from "./mode-switcher";
import type { AppMode } from "@/features/preferences/mode";

type NavItem = { href: string; label: string; icon: typeof Home; badge?: number };

const COMMERCE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/orders", label: "My Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/dashboard/customer/alerts", label: "Price Alerts", icon: Bell },
  { href: "/dashboard/customer/coupons", label: "Coupons", icon: Ticket },
  { href: "/dashboard/customer/addresses", label: "Addresses", icon: MapPin },
  { href: "/dashboard/customer/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/customer/returns", label: "Returns & Refunds", icon: RotateCcw },
  { href: "/dashboard/customer/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/customer/become-seller", label: "Become a Seller", icon: Store },
  { href: "/wallet", label: "Smart Coins", icon: Coins },
  { href: "/dashboard/customer/notifications", label: "Notifications", icon: BellRing },
  { href: "/dashboard/customer/support", label: "Help & Support", icon: LifeBuoy },
  { href: "/dashboard/customer/settings/account", label: "Settings", icon: Settings },
];

const BUILD_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/house-builder", label: "AI House Builder", icon: Sparkles },
  { href: "/estimator", label: "Material Estimator", icon: Boxes },
  { href: "/cost-calculator", label: "Cost Calculator", icon: Ruler },
  { href: "/rfq", label: "RFQs", icon: FileText },
  { href: "/dashboard/customer/procurement", label: "Procurement AI", icon: ClipboardList },
  { href: "/materials", label: "Materials", icon: HardHat },
  { href: "/suppliers", label: "Suppliers", icon: ShoppingBag },
  { href: "/architects", label: "Architects", icon: Building2 },
  { href: "/contractors", label: "Contractors", icon: Wrench },
  { href: "/interior-designers", label: "Interior Designers", icon: ScrollText },
  { href: "/wallet", label: "Smart Coins", icon: Coins },
  { href: "/dashboard/customer/notifications", label: "Notifications", icon: BellRing },
  { href: "/dashboard/customer/support", label: "Help & Support", icon: LifeBuoy },
  { href: "/dashboard/customer/settings/account", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ mode = "commerce", badges }: { mode?: AppMode; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const items = mode === "build" ? BUILD_NAV : COMMERCE_NAV;
  const accent = mode === "build" ? "from-amber-500 to-orange-600" : "from-purple-500 to-indigo-600";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 px-6 pt-5">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br", accent)}>
          {mode === "build" ? <HardHat className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
        </span>
        <span className="text-xl font-bold tracking-tight">SmartBuyX</span>
      </Link>

      <ModeSwitcher mode={mode} />

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {items.map((item) => {
          const badge = badges?.[item.href];
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? mode === "build"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge ? (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  mode === "build"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                )}>{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Bottom CTA — varies by mode */}
      <div className="m-3 mt-0">
        {mode === "build" ? (
          <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30">
            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold">Build your dream</h4>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Sketch a plot → AI generates plans, 3D & BOQ</p>
            <Link
              href="/house-builder"
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-medium text-white shadow-md"
            >
              Try AI House Builder
            </Link>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 dark:from-purple-950/30 dark:to-fuchsia-950/30">
            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Gift className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold">Invite &amp; Earn</h4>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Invite friends and earn</p>
            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">100 Smart Coins</p>
            <Link
              href="/dashboard/customer/invite"
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-md"
            >
              Invite Now
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
