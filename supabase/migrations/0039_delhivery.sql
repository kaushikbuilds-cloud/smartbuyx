-- Replaces Shiprocket as the courier partner (see 0034/0035) with Delhivery.
-- No shipments/supplier_profiles schema changes needed -- those columns were
-- already generic enough (partner_order_id, courier_name, pickup_location_code,
-- etc.) to carry either provider's data.
insert into delivery_partners (name, code, active, config)
values ('Delhivery', 'delhivery', true, '{}'::jsonb)
on conflict (code) do nothing;

-- Shiprocket row is left in place (inert, not deleted) in case of rollback.
update delivery_partners set active = false where code = 'shiprocket';
