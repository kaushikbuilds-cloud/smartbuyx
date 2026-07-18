"use client";

import Link from "next/link";
import { Menu, X, Home, Package, Heart, ShoppingCart, Bell, Ticket, MapPin, CreditCard, RotateCcw, Star, Coins, BellRing, LifeBuoy, Settings, ShoppingBag, HardHat, FolderKanban, FileText, Building2, Wrench, Sparkles, Ruler, Boxes, ScrollText, ClipboardList, Store, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ModeSwitcher } from "./mode-switcher";
import type { AppMode } from "@/features/preferences/mode";

type NavItem = { href: string; label: string; icon: typeof Home };

const COMMERCE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home }, { href: "/orders", label: "My Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart }, { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/dashboard/customer/alerts", label: "Price Alerts", icon: Bell }, { href: "/dashboard/customer/coupons", label: "Coupons", icon: Ticket },
  { href: "/dashboard/customer/addresses", label: "Addresses", icon: MapPin }, { href: "/dashboard/customer/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/customer/returns", label: "Returns & Refunds", icon: RotateCcw }, { href: "/dashboard/customer/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/customer/become-seller", label: "Become a Seller", icon: Store },
  { href: "/wallet", label: "Smart Coins", icon: Coins }, { href: "/dashboard/customer/notifications", label: "Notifications", icon: BellRing },
  { href: "/dashboard/customer/support", label: "Help & Support", icon: LifeBuoy }, { href: "/dashboard/customer/settings/account", label: "Settings", icon: Settings },
];

const BUILD_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home }, { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/house-builder", label: "AI House Builder", icon: Sparkles }, { href: "/estimator", label: "Material Estimator", icon: Boxes },
  { href: "/cost-calculator", label: "Cost Calculator", icon: Ruler }, { href: "/rfq", label: "RFQs", icon: FileText },
  { href: "/dashboard/customer/procurement", label: "Procurement AI", icon: ClipboardList },
  { href: "/materials", label: "Materials", icon: HardHat }, { href: "/suppliers", label: "Suppliers", icon: ShoppingBag },
  { href: "/architects", label: "Architects", icon: Building2 }, { href: "/contractors", label: "Contractors", icon: Wrench },
  { href: "/interior-designers", label: "Interior Designers", icon: ScrollText }, { href: "/wallet", label: "Smart Coins", icon: Coins },
  { href: "/dashboard/customer/notifications", label: "Notifications", icon: BellRing }, { href: "/dashboard/customer/support", label: "Help & Support", icon: LifeBuoy },
  { href: "/dashboard/customer/settings/account", label: "Settings", icon: Settings },
];

export function DashboardMobileNav({ mode, isAdminTier }: { mode: AppMode; isAdminTier?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = mode === "build" ? BUILD_NAV : COMMERCE_NAV;
  const accent = mode === "build" ? "from-amber-500 to-orange-600" : "from-purple-600 to-indigo-600";

  return (
    <>
      <button type="button" aria-label="Open navigation" onClick={() => setOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      {open ? <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col border-r bg-card shadow-2xl transition-transform duration-200 lg:hidden", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between px-5 pt-5">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg font-bold"><span className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white", accent)}>{mode === "build" ? <HardHat className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}</span>SmartBuyX</Link>
          <button aria-label="Close navigation" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <ModeSwitcher mode={mode} />
        {isAdminTier ? (
          <div className="px-3 pt-3">
            <Link
              href="/dashboard/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Admin Panel
            </Link>
          </div>
        ) : null}
        <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-6">
          {items.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", active ? mode === "build" ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="h-4 w-4" />{item.label}</Link>; })}
        </nav>
      </aside>
    </>
  );
}
