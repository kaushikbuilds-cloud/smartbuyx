-- SmartBuyX development/staging demo data.
-- Never run against production: this creates sample accounts and catalog entries.

-- Password for both demo accounts: SmartBuyX123!
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo-buyer@smartbuyx.local', crypt('SmartBuyX123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Buyer"}', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo-seller@smartbuyx.local', crypt('SmartBuyX123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"SmartBuild Supplies"}', now(), now())
on conflict (id) do nothing;

-- Auth triggers create profiles on first insert. This also makes resets idempotent.
insert into public.profiles (id, full_name, role, kyc_status)
values
  ('11111111-1111-4111-8111-111111111111', 'Demo Buyer', 'buyer', 'approved'),
  ('22222222-2222-4222-8222-222222222222', 'SmartBuild Supplies', 'supplier', 'approved')
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, kyc_status = excluded.kyc_status;

insert into public.supplier_profiles (user_id, business_name, gstin, bio, service_pincodes, rating_avg, rating_count)
values ('22222222-2222-4222-8222-222222222222', 'SmartBuild Supplies', '29ABCDE1234F1Z5', 'Verified demo seller for local development.', array['560001', '560002', '560003'], 4.7, 120)
on conflict (user_id) do update set business_name = excluded.business_name, bio = excluded.bio;

insert into public.products (
  id, supplier_id, category_id, kind, title, slug, description, brand, unit,
  base_price, compare_at_price, images, attributes, status, is_featured, rating_avg, rating_count, sales_count, gst_rate, hsn_code
)
select * from (
  values
  ('30000000-0000-4000-8000-000000000001'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, (select id from public.categories where slug = 'electronics'), 'product'::listing_type, 'Nova Wireless Headphones', 'nova-wireless-headphones', 'Comfortable over-ear headphones with immersive sound and all-day battery.', 'Nova', 'piece', 2499::numeric, 3999::numeric, '[{"url":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"}]'::jsonb, '{"color":"Midnight","warranty":"1 year"}'::jsonb, 'active', true, 4.6::numeric, 248, 814, 18::numeric, '85183000'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, (select id from public.categories where slug = 'home-kitchen'), 'product'::listing_type, 'Modern Table Lamp', 'modern-table-lamp', 'Warm LED table lamp for bedside and workspace lighting.', 'Luma Home', 'piece', 1299::numeric, 1899::numeric, '[{"url":"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80"}]'::jsonb, '{"material":"Metal","bulb":"LED included"}'::jsonb, 'active', true, 4.4::numeric, 93, 351, 12::numeric, '94052010'),
  ('30000000-0000-4000-8000-000000000003'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, (select id from public.categories where slug = 'cement'), 'material'::listing_type, 'UltraBuild OPC Cement 50 kg', 'ultrabuild-opc-cement-50kg', 'High-strength OPC cement suitable for structural construction.', 'UltraBuild', 'bag', 425::numeric, 470::numeric, '[{"url":"https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80"}]'::jsonb, '{"grade":"53 grade","weight":"50 kg"}'::jsonb, 'active', true, 4.8::numeric, 187, 1204, 28::numeric, '25232930'),
  ('30000000-0000-4000-8000-000000000004'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, (select id from public.categories where slug = 'tiles'), 'material'::listing_type, 'Ivory Vitrified Floor Tile', 'ivory-vitrified-floor-tile', 'Durable 600 x 600 mm vitrified tile with a soft ivory finish.', 'TerraTile', 'box', 1099::numeric, 1399::numeric, '[{"url":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80"}]'::jsonb, '{"size":"600 x 600 mm","coverage":"15.5 sq ft"}'::jsonb, 'active', true, 4.5::numeric, 72, 486, 18::numeric, '69072100')
) as demo_products(id, supplier_id, category_id, kind, title, slug, description, brand, unit, base_price, compare_at_price, images, attributes, status, is_featured, rating_avg, rating_count, sales_count, gst_rate, hsn_code)
on conflict (id) do update set title = excluded.title, description = excluded.description, base_price = excluded.base_price, compare_at_price = excluded.compare_at_price, images = excluded.images, attributes = excluded.attributes, is_featured = excluded.is_featured, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count, sales_count = excluded.sales_count;

insert into public.product_variants (id, product_id, sku, options, price)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'NOVA-WH-MID', '{"color":"Midnight"}', 2499),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'LUMA-LAMP-WARM', '{"color":"Warm white"}', 1299),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'UB-OPC-50', '{"weight":"50 kg"}', 425),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'TT-IVORY-600', '{"size":"600 x 600 mm"}', 1099)
on conflict (id) do update set price = excluded.price;

insert into public.inventory (variant_id, quantity, reserved)
values
  ('40000000-0000-4000-8000-000000000001', 40, 0),
  ('40000000-0000-4000-8000-000000000002', 25, 0),
  ('40000000-0000-4000-8000-000000000003', 180, 0),
  ('40000000-0000-4000-8000-000000000004', 65, 0)
on conflict (variant_id) do update set quantity = excluded.quantity, reserved = excluded.reserved, updated_at = now();
