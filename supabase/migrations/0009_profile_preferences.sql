-- SmartBuyX — profile preferences: username, DOB, settings JSONB.

alter table profiles
  add column if not exists username text unique,
  add column if not exists date_of_birth date,
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Helpful index for username lookups.
create index if not exists profiles_username_lower_idx on profiles (lower(username));

-- Wishlist visibility lives on its own column so RLS can reference it.
alter table profiles
  add column if not exists wishlist_public boolean not null default false;

-- Allow public viewing of wishlist items when the owner has opted in.
drop policy if exists "wishlist public when opt in" on wishlist_items;
create policy "wishlist public when opt in" on wishlist_items for select using (
  exists(select 1 from profiles p where p.id = user_id and p.wishlist_public)
);
