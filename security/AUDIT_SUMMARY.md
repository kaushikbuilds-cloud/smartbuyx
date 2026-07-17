# Security Audit Summary

Date: 2026-07-16
Checklist: [benavlabs/vibe-check](https://github.com/benavlabs/vibe-check)

## Results

| # | Category | Status | Report | Plan |
|---|----------|--------|--------|------|
| 1 | SECRETS_EXPOSURE | PASS | [report](reports/SECRETS_EXPOSURE_REPORT.md) | — |
| 2 | DATABASE_ACCESS | MEDIUM → fixed | [report](reports/DATABASE_ACCESS_REPORT.md) | [plan](plans/DATABASE_ACCESS_PLAN.md) |
| 3 | AUTH_MIDDLEWARE | HIGH → fixed | [report](reports/AUTH_MIDDLEWARE_REPORT.md) | [plan](plans/AUTH_MIDDLEWARE_PLAN.md) |
| 4 | ACCESS_CONTROL | PASS (1 low finding, fixed) | [report](reports/ACCESS_CONTROL_REPORT.md) | — |
| 5 | FRONTEND_SECRETS | PASS | [report](reports/FRONTEND_SECRETS_REPORT.md) | — |
| 6 | SSRF | HIGH → fixed | [report](reports/SSRF_REPORT.md) | — |
| 7 | CSRF | PASS | [report](reports/CSRF_REPORT.md) | — |
| 8 | SECURITY_HEADERS | MEDIUM → fixed | [report](reports/SECURITY_HEADERS_REPORT.md) | — |
| 9 | CORS | PASS | [report](reports/CORS_REPORT.md) | — |
| 10 | RATE_LIMITING | MEDIUM → partially fixed | [report](reports/RATE_LIMITING_REPORT.md) | — |
| 11 | SQL_INJECTION | PASS | [report](reports/SQL_INJECTION_REPORT.md) | — |
| 12 | XSS | HIGH → fixed | [report](reports/XSS_REPORT.md) | — |
| 13 | PAYMENT_WEBHOOKS | PASS | [report](reports/PAYMENT_WEBHOOKS_REPORT.md) | — |
| 14 | FILE_UPLOADS | MEDIUM → fixed | [report](reports/FILE_UPLOADS_REPORT.md) | — |
| 15 | ERROR_HANDLING | LOW → fixed | [report](reports/ERROR_HANDLING_REPORT.md) | — |
| 16 | PASSWORD_HASHING | N/A (Supabase Auth) | [report](reports/PASSWORD_HASHING_REPORT.md) | — |
| 17 | DEPENDENCIES | LOW, informational | [report](reports/DEPENDENCIES_REPORT.md) | — |

## Critical issues

None rated CRITICAL. The two most serious findings before fixes were:

- **AUTH_MIDDLEWARE** (rated HIGH): two AI-backed Server Actions were reachable directly, bypassing their page-level auth gates, plus a structural risk in the order-fulfilment function that a future refactor could have turned critical. All fixed.
- **XSS** (rated HIGH): two user-submitted URL fields accepted `javascript:`/`data:` URIs due to `.url()` alone not restricting scheme, and rendered as clickable links — a real stored-XSS-to-session-hijack path given the session cookie isn't httpOnly. Fixed at both the schema and render layers.
- **SSRF** (rated HIGH): the image-enhancement action performed an unrestricted server-side fetch of a client-supplied URL. Fixed with a host allowlist.

## Fixes applied this pass (13 commits)

1. Tightened an over-broad `profiles` RLS policy exposing phone/DOB/preferences publicly
2. Added missing auth checks to 2 client-reachable AI Server Actions
3. Structurally isolated order-fulfilment logic out of the Server Action surface
4. Added ownership checks to 5 IDOR-prone query functions
5. Added explicit project-membership checks to 3 project mutation actions
6. Restricted image-enhancement fetch to an allowlisted host (SSRF fix)
7. Added 5 global security response headers including a CSP
8. Added rate limiting to 6 AI-backed actions
9. Restricted 2 user-submitted URL fields to http(s) scheme only, at both schema and render layers (XSS fix)
10. Set file size + MIME type limits on both storage buckets
11. Stopped forwarding raw exception messages to the client on 6 AI/payment call sites

## Post-fix verification (2026-07-17)

Migrations `0013` and `0014` confirmed applied to the live Supabase project by the project owner. Live production (`www.smartbuyx.in`) then verified directly:

- Security headers confirmed live via `curl -L`: full CSP, HSTS (`includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` all present on the real response.
- Supabase Auth confirmed working end-to-end in production: a deliberate wrong-password login attempt returned a clean "Invalid login credentials" message (previously this failed with a raw "fetch failed" network error before the key rotation was completed).
- A public, unauthenticated Server Action (`matchSuppliers` on `/suppliers`) executed a full round-trip — Supabase query, correct empty-state response — with no errors in console or network. Confirms Supabase connectivity broadly, not just auth.
- Vercel is Git-connected and auto-deploys every push to `main` — confirmed via deployment history (every commit from this audit is already `READY`/`production`). No manual redeploy step is needed for code changes going forward, only for env var changes.
- **Not independently verified**: the OpenAI key specifically in production. The one live, unauthenticated test that reaches an OpenAI call (`matchSuppliers`) returned early via its zero-suppliers short-circuit before reaching the AI call, since no real supplier accounts exist yet. Verifying this needs either real login credentials (not available in this session) or seeded supplier data.

## Remaining manual verification (for the human)

- Confirm the OpenAI key works in production directly — e.g. log in and try the AI Assistant or House Builder yourself.
- Confirm the consultations feature still shows counterparty names correctly after the RLS policy change (should be unaffected, but worth a click-through).
- Consider provisioning Upstash Redis + `@upstash/ratelimit` for a fully distributed rate limiter — the in-memory one added in this pass is a real but partial mitigation (see `RATE_LIMITING_REPORT.md`).
- Decide whether to bump the `supabase` CLI dev dependency (major version, low urgency, dev-only).

## Note on this file's handling

Both pending migrations are now confirmed applied to production, and the fixes have been spot-verified live (see above). Per the repo's `.gitignore`, the `security/` folder (this file, plus `reports/` and `plans/`) has **not yet been committed to git** — that decision is being revisited now that the live gap is closed.
