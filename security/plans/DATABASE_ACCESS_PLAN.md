# Database Access (RLS) Fix Plan

## Changes

- `supabase/migrations/0013_fix_profile_pii_exposure.sql` (new) — drops `"profile public pros"`, adds `"profile consultation counterparty"` scoped to an actual consultation relationship.

## New files

- `supabase/migrations/0013_fix_profile_pii_exposure.sql`

## Verification goals

- [x] `grep -c "profile public pros" supabase/migrations/*.sql` shows the policy is dropped in the new migration
- [x] New policy restricts to `exists(select 1 from consultations where ...)`, not `using (true)`
- [ ] Migration applied to the live Supabase project (manual — see below)
- [ ] After applying, `curl {supabase_url}/rest/v1/profiles?role=eq.supplier&select=phone,date_of_birth -H "apikey: {anon_key}"` returns empty/403, not data

## Manual verification (for the human)

1. Open Supabase Dashboard → SQL Editor → paste and run `supabase/migrations/0013_fix_profile_pii_exposure.sql`.
2. Confirm with: `select phone, date_of_birth from profiles where role = 'supplier' limit 1;` run as the `anon` role (Supabase Dashboard has a "Run as" role selector in some versions) — it should return no rows or an error, not data.
3. Confirm the consultations feature still works: as a customer with a scheduled consultation, the pro's name should still display correctly (and vice versa).
