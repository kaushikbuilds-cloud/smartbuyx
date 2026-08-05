-- Shiprocket integration: auto-book a courier shipment as soon as an order is
-- paid. Adds the fields needed to call their Order/AWB/Label APIs and to
-- correlate their IDs back to our shipments row.

alter table products
  add column if not exists weight_kg numeric(6,2) not null default 0.5,
  add column if not exists length_cm numeric(6,2) not null default 10,
  add column if not exists breadth_cm numeric(6,2) not null default 10,
  add column if not exists height_cm numeric(6,2) not null default 10;

alter table shipments
  add column if not exists partner_order_id text,
  add column if not exists partner_shipment_id text,
  add column if not exists courier_name text,
  add column if not exists raw jsonb default '{}'::jsonb;

insert into delivery_partners (name, code, active, config)
values ('Shiprocket', 'shiprocket', true, '{}'::jsonb)
on conflict (code) do nothing;
