# Database Access (RLS) Security Report

## Status: MEDIUM (1 finding, fixed)

## Findings

**Coverage:** Enumerated every `create table` across all 13 migrations (65 tables) and cross-referenced against every `alter table ... enable row level security` statement. **100% of tables have RLS enabled** — no gaps.

**`using (true)` policies:** Found 14 policies using an unconditional `using (true)`. All 14 are `for select` only, on tables that are meant to be public directories: `categories`, `product_variants`, `reviews`, `rfqs` (open marketplace requests), `reel_products`, `affiliate_links`, `live_sessions`, and the business-facing pro-profile tables (`supplier_profiles`, `architect_profiles`, `contractor_profiles`, `engineer_profiles`, `interior_designer_profiles`, `creator_profiles`, `d2c_brand_profiles`). None grant unrestricted write access. The pro-profile tables only expose business fields (business_name, gstin, bio, rating, service_pincodes) — no personal data — which is expected for a B2B trust marketplace where GSTIN/ratings are meant to be publicly checkable.

**Real finding (fixed):** `profiles` table had a policy — `"profile public pros" on profiles for select using (role in ('supplier','architect','contractor'))` — with no column restriction. Since RLS is row-level, this exposed the **entire** `profiles` row (including `phone`, `date_of_birth`, `preferences` jsonb, `kyc_status`) for every pro-role account to **any caller with just the anon/publishable key — no login required**. Confirmed via `grep` that no app code actually relies on this policy for public listings (`suppliers/queries.ts` and friends correctly read from the scoped `supplier_profiles`/`architect_profiles`/`contractor_profiles` tables instead). The only legitimate cross-user read of `profiles` is a consultation-counterparty name lookup in `features/consultations/queries.ts`, which wasn't even covered by the old policy's role restriction if the counterparty was a customer.

**Sensitive tables spot-checked and confirmed correctly scoped:** `addresses` (owner-only via `auth.uid() = user_id`), `payment_methods` (owner-only), `orders`/`order_items`/`payments` (buyer or supplier via relationship join, admin bypass), `wallets`/`wallet_transactions` (owner-only), `notifications` (owner-only, insert also constrained to own `user_id` so it can't be used to spoof notifications to other users), `escrow_holds` (buyer & seller read via relationship, admin-only write), `purchase_orders` (buyer-owner, supplier read/status-only update — this one has an additional trigger guard from when it was built, see migration 0012).

## What's at risk

Before the fix: anyone (no auth needed) could run `GET {supabase_url}/rest/v1/profiles?role=eq.supplier&select=*` with the anon key and get phone numbers, dates of birth, and notification preferences for every supplier/architect/contractor account on the platform.

## What's already secure

- 100% RLS coverage, no missing tables.
- No dangerous write-side `using(true)` anywhere.
- Consistent, correct ownership-scoping pattern (`auth.uid() = owner_column`) used throughout, including on every table added in this session (`purchase_orders`, `return_requests` dispute columns).
- `is_admin()` bypass used consistently for admin read access rather than ad-hoc role checks.

## Recommendations

1. **Applied** — migration `0013_fix_profile_pii_exposure.sql` drops `"profile public pros"` and replaces it with `"profile consultation counterparty"`, scoped to an actual `consultations` relationship (`customer_id`/`pro_id` match `auth.uid()`), so the one legitimate cross-user lookup still works without exposing every pro's PII to the public internet.
2. This migration needs to be applied to the live Supabase project (it's currently only in the repo) — see manual verification below.
