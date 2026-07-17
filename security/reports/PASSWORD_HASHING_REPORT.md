# Password Hashing Security Report

## Status: N/A (third-party auth provider)

## Findings

All authentication (email/password sign-up and sign-in, Google OAuth, password reset) goes through Supabase Auth (`supabase.auth.signInWithPassword`, `signUp`, `resetPasswordForEmail`, `signInWithOAuth` in `features/auth/actions.ts`). No custom password storage, hashing, or verification code exists anywhere in `src/`.

Supabase Auth's server (GoTrue) hashes passwords with bcrypt internally — this is Supabase's documented, standard behavior and isn't something the app implements or could misconfigure from the client side.

Confirmed no legacy/custom password code exists anywhere in the app (`grep` for `md5`/`sha1`/manual hashing patterns across `src/` returns nothing). Even `supabase/seed.sql`'s demo account passwords correctly use `crypt('...', gen_salt('bf'))` — bcrypt via Postgres's `pgcrypto` extension — consistent with what Supabase Auth itself uses.

## What's at risk

Nothing — this is entirely delegated to a provider that already does it correctly.

## What's already secure

N/A by design — no custom implementation to audit.

## Recommendations

None.
