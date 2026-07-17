# Error Handling Security Report

## Status: LOW (finding, fixed)

## Findings

- No custom `error.tsx`/`global-error.tsx` exists anywhere in `src/app`. This is not itself a leak: Next.js's default production behavior already redacts stack traces and error detail for unhandled Server Component exceptions, rendering a generic error page automatically — a custom error boundary would only be needed for a nicer UX, not for safety.
- No `productionBrowserSourceMaps: true` or other debug-mode setting in `next.config.ts` — production builds don't ship source maps by default, which is the safe default.
- Found 29 places across `src/features` that return `{ error: error.message }` from a Supabase/PostgREST call. Sampled these: they're typical CRUD failure messages (unique constraint violations, RLS policy rejections) which at most reveal a column/constraint name — low sensitivity, no stack traces, no credentials, no file paths. Left as-is; refactoring all 29 for a low-severity, low-likelihood issue wasn't worth the change surface given the rest of the audit's priorities.
- Found 6 places that catch **any** exception around a third-party SDK call (OpenAI, Razorpay) and forwarded `e.message` verbatim to the client for unexpected/unknown error types. This is riskier than the Supabase case: an unexpected bug (a `TypeError`, a malformed response, a lower-level library error) could surface an internal variable name, property path, or occasionally more — not catastrophic, but exactly the class of thing this audit category exists to catch, and an easy fix.

## What's at risk

Minor internal detail disclosure (a variable name, a constraint name) in an edge case — not credentials, not PII, not stack traces.

## What's already secure

Next.js's production defaults for unhandled exceptions and source maps are both already safe without any custom code.

## Recommendations

**Applied** — added `src/lib/utils/safe-error.ts` (`safeErrorMessage`), which logs the real error server-side (`console.error`) and always returns a generic, pre-written message to the client. Applied to all 6 generic `catch (e) { ... e instanceof Error ? e.message : ... }` sites: `askAssistant`, `askProcurement`, `askSupport`, `generateListing`, `startPlanCheckout`, `createCheckoutOrder`. The Supabase-error-message pattern (29 sites) was left as-is given its low severity — worth a follow-up pass if the app's threat model tightens, not urgent now.
