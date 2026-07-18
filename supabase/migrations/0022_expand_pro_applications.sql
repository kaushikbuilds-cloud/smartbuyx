-- Expand the seller/pro application to the MVP field set: basic contact,
-- business details, store info, address, and T&C acceptance. Bank details and
-- KYC document uploads are intentionally NOT collected here -- those are
-- sensitive and belong in a post-approval, encrypted step, not the initial
-- self-service application.
alter table pro_applications
  add column if not exists phone text,
  add column if not exists business_type text,
  add column if not exists category text,
  add column if not exists gstin text,
  add column if not exists description text,
  add column if not exists website text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text default 'IN',
  add column if not exists years_in_business int,
  add column if not exists terms_accepted boolean not null default false;
