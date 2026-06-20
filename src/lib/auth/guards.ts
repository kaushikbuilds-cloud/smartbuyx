import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = (user.app_metadata?.role as UserRole | undefined) ?? "customer";
  return { user, role };
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...allowed: UserRole[]) {
  const session = await requireUser();
  if (!allowed.includes(session.role)) redirect("/dashboard/customer");
  return session;
}
