-- Loyalty Points integration for Fastrr Checkout, tied to the existing
-- Smart Coins wallet (1 point = ₹1, matching how `wallets.balance` is
-- already treated as a plain INR amount elsewhere in the app).
--
-- Blocking is separate from spending: Fastrr "blocks" points during
-- checkout (before payment completes) and either confirms the order
-- (permanent debit) or unblocks (release the hold). `blocked_balance`
-- tracks holds so a user's *available* balance during checkout accounts
-- for points already committed to an in-progress order elsewhere.
alter table wallets add column if not exists blocked_balance numeric(12,2) not null default 0;

create table wallet_point_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  fastrr_order_id text not null unique,
  points numeric(12,2) not null,
  status text not null default 'blocked', -- blocked | used | released
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on wallet_point_blocks (status, created_at);

alter table wallet_point_blocks enable row level security;
create policy "wallet_point_blocks owner read" on wallet_point_blocks for select using (
  user_id = auth.uid() or public.is_admin()
);
