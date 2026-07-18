import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/types/auth";

// Every page render goes through AppShell (which calls this to pick dashboard
// vs. marketing chrome) and then usually again via requireUser/requireRole in
// the page itself, plus DashboardHeader. Without per-request memoization that
// was N redundant Supabase Auth round-trips on every single navigation.
// React's cache() dedupes calls within one request (server components only).
export const getSession = cache(async function getSession() {
  // Don't crash the page if Supabase env is missing (e.g. unset on host).
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const role = (user.app_metadata?.role as UserRole | undefined) ?? "customer";
    return { user, role };
  } catch {
    return null;
  }
});

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...allowed: UserRole[]) {
  const session = await requireUser();
  if (!allowed.includes(session.role)) redirect("/");
  return session;
}
