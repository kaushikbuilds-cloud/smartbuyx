# Security Headers Security Report

## Status: MEDIUM (finding, fixed)

## Findings

Checked `next.config.ts`, `src/middleware.ts`, and for a `vercel.json` — none set any security headers. `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and `Content-Security-Policy` were all completely absent from every response.

Before writing a CSP, checked what external resources the app actually loads to avoid shipping a policy that breaks real functionality: the Razorpay checkout script (`checkout.razorpay.com/v1/checkout.js`, loaded via `next/script` in two components) and its payment iframe, Supabase (`*.supabase.co`, REST + realtime + storage), and a couple of external image hosts (`images.unsplash.com` for seed data, `cdn.simpleicons.org` for brand logos via a deliberately-plain `<img>` tag that bypasses `next/image`).

## What's at risk

Before the fix: no clickjacking protection (the site could be iframed by any other site), no MIME-sniffing protection, no HTTPS enforcement header, and no restriction at all on what a successful XSS payload could exfiltrate to or load from.

## What's already secure

N/A — this category had nothing in place before the fix.

## Recommendations

**Applied** — added `headers()` to `next.config.ts`, applied globally via a single `source: "/:path*"` match (per the audit's verification goal — one global source, not per-route):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy`: restricts `connect-src`/`frame-src` to Supabase + Razorpay, `img-src` to `https:`/`data:`/`blob:` (needed for the varied external image hosts), and sets `frame-ancestors 'none'` + `base-uri 'self'` + `form-action 'self'`.

**Known tradeoff, not a bug:** `script-src` includes `'unsafe-inline' 'unsafe-eval'`. Next.js's own hydration bootstrap script is inline by default, and removing this without setting up per-request CSP nonces (extra middleware plumbing, not implemented here) would break every page. This CSP still meaningfully restricts `connect-src`, `frame-src`, `frame-ancestors`, and `object-src` (via `default-src 'self'` with no `object-src` override) — the highest-value restrictions for this app — while leaving `script-src` at a pragmatic baseline. Tightening `script-src` with nonces is a reasonable follow-up if this app's threat model changes, but not urgent for the vulnerability classes this audit targets.

**Verified working**, not just configured: restarted the dev server (config changes require a restart, unlike env vars — actually those need a restart too, but config specifically), confirmed via `curl -D -` that all five headers are present on a real response, and loaded both the homepage and login page in a real browser — zero console errors, zero CSP violations, both pages render and function normally.
