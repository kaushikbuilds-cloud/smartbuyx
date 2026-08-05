-- New supplier pricing: 4 tiers, each with a monthly fee + a per-order
-- commission rate that decreases as the fee goes up. Replaces the old
-- supplier_free/starter/premium/annual seed rows (0003) with this structure.
alter table plans
  add column if not exists commission_percent numeric(4,2) not null default 0;

alter table escrow_holds
  add column if not exists commission_amount numeric(12,2) not null default 0;

update plans set
  price_inr = 0, commission_percent = 2.00,
  features = '["Supplier profile listing","Material catalog (10 items)","5 inquiries/month","2% commission per order","Standard support"]'::jsonb
where code = 'supplier_free';

update plans set
  price_inr = 499, commission_percent = 1.00,
  features = '["50 material listings","20 inquiries/month","1% commission per order","Basic analytics","Email support"]'::jsonb
where code = 'supplier_starter';

update plans set
  price_inr = 1999, commission_percent = 0.00,
  features = '["Verified supplier badge","Unlimited material listings","0% commission — you keep 100%","Priority in cost calculator","Unlimited customer inquiries","Free MSME (Udyam) registration assistance","Free GST filing assistance (quarterly)","Analytics & reports","Priority support"]'::jsonb
where code = 'supplier_premium';

-- Doesn't fit the new 4-tier structure -- hidden, not deleted (non-destructive).
update plans set active = false where code = 'supplier_annual';

insert into plans (code, audience, tier, name, tagline, price_inr, billing_period, features, highlight, sort_order, commission_percent)
values (
  'supplier_growth', 'supplier', 'growth', 'Growth', 'Most Popular', 999, 'monthly',
  '["Unlimited material listings","0.5% commission per order","Priority in cost calculator","Unlimited customer inquiries","Free MSME (Udyam) registration assistance","Analytics & reports","Priority support"]'::jsonb,
  true, 3, 0.50
)
on conflict (code) do update set
  price_inr = excluded.price_inr,
  commission_percent = excluded.commission_percent,
  features = excluded.features,
  active = true;

-- supplier_premium was sort_order 3 (highlighted); growth now takes that slot.
update plans set sort_order = 4, highlight = false where code = 'supplier_premium';

-- Escrow release now deducts commission per the seller's active supplier
-- plan (2% if they have none -- same rate as the Free tier) before crediting
-- their wallet. commission_amount is recorded on the hold for the seller's
-- own audit trail, not paid out anywhere -- it's simply not released.
create or replace function public.release_escrow(p_order uuid, p_seller uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  h escrow_holds;
  commission_pct numeric(4,2);
  commission_amt numeric(12,2);
  net_amt numeric(12,2);
begin
  select * into h from escrow_holds
    where order_id = p_order and seller_id = p_seller and status = 'held'
    for update;
  if not found then return; end if;

  select p.commission_percent into commission_pct
  from subscriptions s join plans p on p.id = s.plan_id
  where s.user_id = p_seller and s.status = 'active' and p.audience = 'supplier'
  order by s.started_at desc limit 1;

  commission_pct := coalesce(commission_pct, 2.00);
  commission_amt := round(h.amount * commission_pct / 100, 2);
  net_amt := h.amount - commission_amt;

  perform public.credit_wallet(p_seller, net_amt, 'credit', 'escrow:'||p_order);

  update escrow_holds set status = 'released', released_at = now(), commission_amount = commission_amt where id = h.id;
end; $$;
