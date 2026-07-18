-- jwt_role() read auth.jwt()->>'role', which is the top-level Postgres role
-- claim ("authenticated"/"anon") -- NOT the application role. The app role is
-- synced into app_metadata.role (sync_role_to_jwt trigger, migration 0018).
-- Result: is_seller()/is_admin() were ALWAYS false for real users, so every
-- RLS policy gated on them (e.g. sellers creating products) failed with
-- "new row violates row-level security policy". Admin paths hid this because
-- they use the service-role client, which bypasses RLS entirely.
create or replace function public.jwt_role() returns text
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'customer')
$$;
