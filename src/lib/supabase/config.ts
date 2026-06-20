// True only when real Supabase env is configured.
// Used to short-circuit queries when running against placeholder env so we
// don't spam console errors with ENOTFOUND from fake URLs.
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return false;
  if (url.includes("placeholder")) return false;
  if (key.includes("placeholder")) return false;
  return true;
}
