# CSRF Security Report

## Status: PASS

## Findings

- Session cookies are set by `@supabase/ssr`, whose `DEFAULT_COOKIE_OPTIONS` (`node_modules/@supabase/ssr/src/utils/constants.ts`) is `{ path: "/", sameSite: "lax", httpOnly: false, maxAge: ... }`. Confirmed the codebase (`lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `lib/supabase/client.ts`) never overrides this — every cookie set by the auth flow carries `SameSite=Lax`.
- All state-changing operations in this app go through Next.js Server Actions, not hand-rolled POST endpoints. Next.js (14+, this project is on 15.5.19) has **built-in CSRF protection for Server Actions**: it compares the request's `Origin` header against the `Host` header and rejects cross-origin POSTs by default. This requires no app code to enable.
- Checked `next.config.ts` for `experimental.serverActions.allowedOrigins` (the only way to weaken this default) — not set, so the strict same-origin default is in effect.
- The one traditional POST endpoint, `/api/razorpay/webhook`, doesn't use cookies/session at all — it's authenticated by HMAC signature verification instead (see PAYMENT_WEBHOOKS report), so CSRF doesn't apply to it.

## What's at risk

Nothing found.

## What's already secure

Both layers (SameSite=Lax cookies + Next.js's Origin-header check on Server Actions) are active without any custom code, and neither has been weakened by configuration.

## Recommendations

None. Side note (not a CSRF issue, flagged for awareness): `httpOnly: false` on the session cookie is Supabase's intentional default so the browser client SDK can read it — this is a normal tradeoff for the SSR auth pattern, not a misconfiguration, but it does mean the cookie is theoretically readable by any script that executes in-page, which raises the stakes of the XSS audit (category 12) being clean.
