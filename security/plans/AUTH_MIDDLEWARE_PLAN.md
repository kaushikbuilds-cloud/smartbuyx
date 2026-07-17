# Auth Middleware Fix Plan

## Changes

- `src/features/ai/assistant.ts` — added `requireUser()` as first line of `askAssistant`.
- `src/features/ai/procurement.ts` — added `requireUser()` as first line of `askProcurement`.
- `src/features/orders/checkout-actions.ts` — removed `fulfilPaidOrder`, re-imports it from the new module.
- `src/app/api/razorpay/webhook/route.ts` — updated import path for `fulfilPaidOrder`.
- `src/features/account/payment-methods.ts` — `listPaymentMethods` now asserts `session.user.id === userId`.
- `src/features/orders/returns.ts` — `listMyReturns` asserts ownership; `listSellerReturns` asserts role + ownership (was admin-client-backed with zero protection).
- `src/features/onboarding/actions.ts` — `getMyProApplication` asserts ownership.
- `src/features/preferences/alerts.ts` — `listMyAlerts` asserts ownership.

## New files

- `src/features/orders/fulfil-paid-order.ts` — `fulfilPaidOrder` extracted here, deliberately without `"use server"` so it can never become a client-callable RPC endpoint.

## Verification goals

- [x] `askAssistant` and `askProcurement` both redirect/throw when called without a session
- [x] `fulfilPaidOrder` no longer lives in any `"use server"` file (`grep -l "use server" src/features/orders/*.ts` excludes `fulfil-paid-order.ts`)
- [x] Both callers of `fulfilPaidOrder` (checkout-actions.ts, webhook route.ts) updated and typecheck clean
- [x] All 5 previously-unguarded query functions return empty/null when `userId` param doesn't match the session
- [x] `npx tsc --noEmit` passes with zero errors after all changes

## Manual verification (for the human)

- After deploying, log in as User A, open browser devtools, and try calling the AI assistant / procurement chat while logged out in an incognito tab pointed at the same action — should get redirected/blocked, not a response.
- Confirm the returns page (`/dashboard/customer/returns`) and seller returns dashboard (`/dashboard/supplier/returns`) still load correctly for their respective owners after the ownership check was added (should be unaffected — the fix only rejects mismatched ids, and the real call sites always pass the caller's own id).
