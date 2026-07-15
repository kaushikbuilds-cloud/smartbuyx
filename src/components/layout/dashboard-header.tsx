import Link from "next/link";
import { Heart, ShoppingCart, Coins, ChevronDown, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";
import { getCartCount, getWalletBalance } from "@/features/account/wallet-queries";
import { getUnreadCount, getRecentNotifications } from "@/features/notifications/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "./notification-bell";

export async function DashboardHeader() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const [profileRes, cartCount, wallet, wishlistRes, unreadCount, recentNotifications] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", session.user.id).single(),
    getCartCount(session.user.id),
    getWalletBalance(session.user.id),
    supabase.from("wishlist_items").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
    getUnreadCount(session.user.id),
    getRecentNotifications(session.user.id),
  ]);
  const fullName = profileRes.data?.full_name ?? session.user.email ?? "there";
  const firstName = fullName.split(" ")[0];
  const initials = firstName.slice(0, 2).toUpperCase();
  const wishlistCount = wishlistRes.count ?? 0;

  return (
    <header className="flex items-center gap-4 border-b bg-background px-6 py-3">
      {/* Search with categories */}
      <form action="/products" className="flex flex-1 items-stretch overflow-hidden rounded-xl border bg-muted/30 focus-within:ring-2 focus-within:ring-purple-500/30">
        <div className="flex items-center pl-4 text-muted-foreground"><Search className="h-4 w-4" /></div>
        <input
          name="q"
          placeholder="Search for products, brands and more..."
          className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
        />
        <div className="hidden items-center gap-1 border-l border-border/60 px-3 text-xs text-muted-foreground sm:flex">
          All Categories <ChevronDown className="h-3 w-3" />
        </div>
        <button type="submit" className="flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 px-5 text-white hover:opacity-90">
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Smart Coins pill */}
      <Link href="/wallet" className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 hover:shadow-sm md:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <Coins className="h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-medium text-muted-foreground">Smart Coins</p>
          <p className="text-sm font-bold">{Math.round(wallet).toLocaleString("en-IN")}</p>
        </div>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </Link>

      <NotificationBell unreadCount={unreadCount} recent={recentNotifications} />

      <Link href="/wishlist" aria-label="Wishlist" className="relative flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-muted">
        <Heart className="h-5 w-5" />
        {wishlistCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{wishlistCount}</span>
        ) : null}
      </Link>

      <Link href="/cart" aria-label="Cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-muted">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">{cartCount}</span>
        ) : null}
      </Link>

      <Link href="/dashboard/customer/settings" className="flex items-center gap-3 rounded-xl border bg-card pl-1 pr-3 py-1 hover:bg-muted">
        <Avatar className="h-9 w-9">
          {profileRes.data?.avatar_url ? <AvatarImage src={profileRes.data.avatar_url} alt={fullName} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight">Hi, {firstName}</p>
          <p className="text-xs text-muted-foreground">View Profile</p>
        </div>
      </Link>
    </header>
  );
}
