"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, forgotPasswordSchema } from "./schemas";

export type ActionState = { error?: string; success?: string } | null;

export async function signInWithPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const next = (formData.get("next") as string) || "/";
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
    },
  });
  if (error) return { error: error.message };
  return { success: "Check your email to confirm your account, then log in." };
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: "If that email exists, a reset link is on its way." };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback` },
  });
  if (error) return;
  if (data.url) redirect(data.url);
}

// Native (Capacitor) Google sign-in: returns the provider URL instead of
// redirecting, so the app can open it in a system browser tab and return via
// a deep link. redirectTo is the app's custom scheme; the PKCE verifier is
// stored as a cookie on this same webview, so when the app later loads
// /callback?code=... the server exchange finds it and sets the session.
const NATIVE_OAUTH_REDIRECT = "in.smartbuyx.app://callback";

export async function getGoogleOAuthUrl(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: NATIVE_OAUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) return { error: error.message };
  return { url: data.url ?? undefined };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
