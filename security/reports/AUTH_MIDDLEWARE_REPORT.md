# Auth Middleware Security Report

## Status: HIGH (2 real gaps found and fixed, 5 defense-in-depth gaps found and fixed)

## Findings

**Architecture:** This is a Next.js Server Actions app, not a traditional REST API. Auth is enforced two ways: (1) `middleware.ts` redirects unauthenticated requests to `/login` for a `PROTECTED` path prefix list, and role-gates a few `/dashboard/*` prefixes; (2) every page calls `requireUser()`/`requireRole()` server-side before rendering. Neither of these protects a Server Action by itself — **Server Actions in files with `"use server"` are independently network-callable**, and Next.js only ships the callable reference to the browser if the action is referenced from a `"use client"` component. A page-level or middleware gate does not stop a direct call to the action if the action doesn't check auth itself.

Went through all 28 `"use server"` files in `src/features/` and checked every exported function for an internal `requireUser()`/`requireRole()`/`getSession()` call.

### Real, exploitable gaps (fixed)

1. **`askAssistant`** (`features/ai/assistant.ts`) — the `/assistant` page is gated (`requireUser()`), but the action itself had zero auth check. `AssistantChat` (the component that calls it) is a `"use client"` component, so this action's reference **is** shipped to the browser — anyone, logged in or not, could call it directly and run OpenAI completions on the project's dime with no rate limit.
2. **`askProcurement`** (`features/ai/procurement.ts`) — identical issue: `/dashboard/customer/procurement` is gated, the action wasn't, `ProcurementChat` is a client component so the gap was live.

Both fixed by adding `await requireUser()` as the first line of the action.

### Structural risk (fixed): `fulfilPaidOrder`

`fulfilPaidOrder(orderId)` — the function that flips an order to `paid`, decrements stock, creates shipments, and opens escrow — lived in `checkout-actions.ts`, a `"use server"` file, with **no auth check and no payment verification of its own** (by design: it trusts that its two callers, `verifyAndFinalizeOrder` and the Razorpay webhook, already verified payment before calling it). Today it's only ever imported from other server-only code, so Next.js never exposes it to the client and it isn't currently callable externally. But this was one accidental future import (e.g. someone wiring a "resend confirmation" button that calls it from a client component) away from becoming a critical vulnerability: anyone could call `fulfilPaidOrder("<any-pending-order-id>")` and get an order marked paid, shipped, and escrowed without paying a rupee.

**Fixed structurally, not just documented**: extracted `fulfilPaidOrder` into `features/orders/fulfil-paid-order.ts`, a plain module without `"use server"`. Next.js only auto-exposes exports from files carrying that directive — a plain module can never become a client-callable RPC endpoint, no matter what imports it in the future. This is stronger than "remember not to import this into a client component."

### Defense-in-depth gaps (fixed)

Five query functions took a `userId`/`sellerId` parameter and trusted the caller instead of checking it against the authenticated session:

- `listPaymentMethods(userId)` (`features/account/payment-methods.ts`)
- `listMyReturns(userId)` (`features/orders/returns.ts`)
- `listSellerReturns(sellerId)` (`features/orders/returns.ts`)
- `getMyProApplication(userId)` (`features/onboarding/actions.ts`)
- `listMyAlerts(userId)` (`features/preferences/alerts.ts`)

Severity varied by which Supabase client each uses:
- Four of the five use the **RLS-bound client** (`createClient()`), so even a spoofed `userId` argument would only ever return rows Postgres RLS already restricts to the caller's own `auth.uid()` — not exploitable today, RLS was already the real backstop.
- **`listSellerReturns` uses the admin client** (`createAdminClient()`, bypasses RLS — needed because RLS can't cheaply express "return requests joined to order_items where I'm the supplier"). This one had **zero protection** beyond the missing check. All five call sites are currently Server Components (safe today), but this was the one where a future client-component import would have been a live IDOR, not just a defense-in-depth nicety.

All five fixed with an explicit ownership assertion (`if (user.id !== userId) return [] / null`), and `listSellerReturns` additionally requires the `supplier`/`d2c_brand`/`admin`/`superadmin` role.

## What's already secure

- Every mutation-style Server Action (23 of the 28 files) already called `requireUser()`/`requireRole()`/`getSession()` correctly, immediately as the first statement.
- Query-only modules **without** `"use server"` (e.g. `return-analytics.ts`, `suppliers/queries.ts`, `notifications/queries.ts`) are structurally safe regardless of parameter trust — Next.js never auto-exposes plain modules as RPC endpoints, only files with the `"use server"` directive.
- `middleware.ts` correctly redirects unauthenticated requests for every protected prefix and role-gates admin/pro dashboard sections as a second layer.

## Recommendations

1. Minor, non-security: `middleware.ts`'s `ROLE_GATES["/dashboard/supplier"]` doesn't include `d2c_brand`, but several supplier pages' own `requireRole()` calls do allow `d2c_brand` — meaning a `d2c_brand` user gets redirected by middleware before ever reaching the page that would've let them in. Functional bug, not a vulnerability (middleware is over-restrictive, not under-restrictive) — worth a quick fix separately from this audit.
2. Going forward: any new function in a `"use server"` file that accepts a `userId`/resource-owner parameter should assert it against the session, not just filter by it — don't rely on RLS alone as the only backstop for functions using the admin client.
