-- SmartBuyX — fix: profiles.role still defaulted to the legacy 'buyer' value.
-- Migration 0002 added 'customer' to the enum and commented that new signups
-- should use it, but never actually changed the column default or backfilled
-- existing rows — every signup since has still gotten 'buyer'. App code
-- (features/onboarding/actions.ts, the become-seller page) checks specifically
-- for role = 'customer', so every real account has been silently blocked from
-- the self-service seller/pro application flow.

alter table profiles alter column role set default 'customer';

-- Backfill: this UPDATE fires the existing on_profile_role_change trigger
-- (after insert or update of role), which re-syncs the corrected role into
-- each affected user's auth.users.raw_app_meta_data automatically — no need
-- to touch auth.users directly.
update profiles set role = 'customer' where role = 'buyer';
