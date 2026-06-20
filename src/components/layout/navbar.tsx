import Link from "next/link";
import { Building2, Bell, ShoppingCart } from "lucide-react";
import { getSession } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { SearchBar } from "./search-bar";

const NAV = [
  { href: "/products", label: "Shop" },
  { href: "/materials", label: "Materials" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/rfq", label: "Get Quotes" },
  { href: "/architects", label: "Hire a Pro" },
  { href: "/house-builder", label: "AI Builder" },
  { href: "/plans", label: "Pricing" },
];

export async function Navbar() {
  const session = await getSession();
  let profile: { full_name: string | null; avatar_url: string | null } | null = null;
  if (session) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", session.user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="text-lg">SmartBuyX</span>
        </Link>

        <SearchBar />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild aria-label="Cart">
            <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
          </Button>
          {session ? (
            <>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <UserMenu email={session.user.email ?? ""} name={profile?.full_name} avatarUrl={profile?.avatar_url} />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild><Link href="/login">Log in</Link></Button>
              <Button variant="gradient" size="sm" asChild><Link href="/register">Sign up</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
