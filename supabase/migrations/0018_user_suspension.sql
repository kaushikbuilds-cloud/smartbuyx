-- SmartBuyX — user suspension (Super Admin: "suspend or ban users").

alter table profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text;

create index if not exists profiles_suspended_idx on profiles (is_suspended) where is_suspended;

-- Mirror is_suspended into JWT app_metadata too, same pattern as role, so
-- middleware can block a suspended user without a DB round-trip per request.
create or replace function public.sync_role_to_jwt()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('role', new.role::text, 'suspended', new.is_suspended)
   where id = new.id;
  return new;
end; $$;

drop trigger if exists on_profile_role_change on profiles;
create trigger on_profile_role_change
after insert or update of role, is_suspended on profiles
for each row execute function public.sync_role_to_jwt();

-- Backfill existing sessions' metadata so already-created accounts get the
-- suspended flag too, not just future role/suspension changes.
update profiles set is_suspended = is_suspended;
