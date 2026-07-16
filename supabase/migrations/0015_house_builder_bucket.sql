-- SmartBuyX — storage bucket for AI House Builder plot sketch/photo uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('house-plans', 'house-plans', true, 10 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "house plans public read" on storage.objects;
create policy "house plans public read" on storage.objects
  for select using (bucket_id = 'house-plans');

drop policy if exists "house plans authenticated write" on storage.objects;
create policy "house plans authenticated write" on storage.objects
  for insert to authenticated with check (bucket_id = 'house-plans');
