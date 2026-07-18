-- Systemic fix: no migration ever issued a base table GRANT to `authenticated`
-- (checked -- 0001_init.sql has none, and no REVOKE exists either). Every table
-- has RLS enabled and real policies, but RLS is evaluated only AFTER the grant
-- check, so any table whose default privileges didn't carry over failed with
-- "permission denied" regardless of a passing policy. This has now hit
-- pro_applications (0017), supplier_profiles (0025), products (0026), and
-- carts/cart_items (crashed checkout with a null-derefs after a swallowed
-- insert error). Rather than patching tables one at a time as each is
-- discovered, grant broadly here -- RLS (enabled on every table per this
-- project's convention) remains the actual access boundary.
grant usage on schema public to authenticated, anon;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant select
  on all tables in schema public
  to anon;

grant usage, select on all sequences in schema public to authenticated, anon;

-- Cover tables created by future migrations too.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, anon;
