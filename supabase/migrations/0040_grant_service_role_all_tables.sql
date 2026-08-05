-- Root cause of PayU payments appearing "not found" despite genuinely
-- existing: the admin/service-role client (createAdminClient, used by
-- payu-result.ts, fulfil-paid-order.ts, and every other admin-side action)
-- was never granted table privileges on `payments` -- confirmed via a live
-- production error: "permission denied for table payments" (Postgres error
-- 42501). GRANTs are checked before RLS, so this failed silently as a plain
-- "no rows found" from the app's point of view, not an obvious auth error.
--
-- Same bug class as 0028 (which fixed this for `authenticated`/`anon`) --
-- no migration had ever explicitly granted service_role privileges either,
-- and it seems this specific project's service_role does NOT implicitly
-- bypass grants the way a typical Supabase service_role normally would.
-- Granting broadly here since RLS remains the real access boundary anyway.
grant usage on schema public to service_role;

grant select, insert, update, delete
  on all tables in schema public
  to service_role;

grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
