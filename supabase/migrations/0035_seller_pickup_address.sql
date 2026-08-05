-- Per-seller Shiprocket pickup address. A marketplace can't use one single
-- pickup location for every seller's orders -- each seller ships from their
-- own warehouse/shop. Shiprocket supports multiple pickup addresses under one
-- account (ours), each tagged with a unique nickname; we register one per
-- seller via their "Add Pickup Location" API and store the resulting
-- nickname here so create-shipment.ts can pick the right one per order.
alter table supplier_profiles
  add column if not exists pickup_name text,
  add column if not exists pickup_phone text,
  add column if not exists pickup_email text,
  add column if not exists pickup_address_line1 text,
  add column if not exists pickup_address_line2 text,
  add column if not exists pickup_city text,
  add column if not exists pickup_state text,
  add column if not exists pickup_pincode text,
  add column if not exists pickup_location_code text,
  add column if not exists pickup_registered boolean not null default false;
