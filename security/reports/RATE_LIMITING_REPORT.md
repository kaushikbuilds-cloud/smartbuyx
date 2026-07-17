# Rate Limiting Security Report

## Status: MEDIUM (finding, partially fixed — see caveat)

## Findings

**Login, registration, password reset:** all go through Supabase Auth's hosted API (`supabase.auth.signInWithPassword`, `signUp`, `resetPasswordForEmail` in `features/auth/actions.ts`) rather than custom endpoints. Supabase's platform applies its own rate limiting to these calls server-side, ahead of this app's code — not something the app needs to implement itself, and not bypassable from the app layer.

**AI endpoints (real per-call cost, previously unlimited):** `askAssistant`, `askProcurement`, `askSupport`, `generateListing`, `enhanceProductImage`, `matchSuppliers` all call OpenAI with no rate limiting at all. Five of six are gated behind login (so abuse requires an account, but any of the ~10 authenticated roles could still loop-call them); `matchSuppliers` is intentionally public (no login) per product design.

## What's at risk

An authenticated (or, for `matchSuppliers`, anonymous) user scripting repeated calls could run up the project's OpenAI bill with no ceiling. `enhanceProductImage` is the costliest (image generation, not just text completion).

## What's already secure

Auth endpoints — Supabase's own platform default.

## Recommendations

**Applied, with an important caveat:** added `src/lib/rate-limit.ts`, a simple in-memory sliding-window limiter, and wired it into all six AI actions — 20 requests/minute per user for text (assistant/procurement/support/listing), 8/minute for image enhancement, 15/minute per IP for the public supplier matcher.

**This is a real mitigation but not a complete fix.** The limiter's state lives in the serverless function's memory. On Vercel, a new cold-start instance gets a fresh counter, and concurrent instances don't share counts — so a sufficiently distributed or persistent attacker can still exceed the intended limit. This raises the cost of casual single-client abuse (a script hammering one endpoint in a loop) to near-zero infra cost, but doesn't fully close the gap. **The correct complete fix is a shared store** — Upstash Redis + `@upstash/ratelimit` is the standard pairing for Vercel — which requires provisioning an external service and wiring new env vars, not something set up in this pass. Flagged as the natural next step, not implemented here since it needs an account/credentials decision from the project owner.

The IP-keying for `matchSuppliers` reads `x-forwarded-for`, which Vercel's edge sets/overwrites with the real client IP (not client-spoofable there); if this app is ever hosted somewhere that doesn't do the same header-scrubbing, that assumption needs re-verifying.
