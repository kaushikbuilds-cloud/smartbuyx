-- AR "View in My Room": product 3D models for Google Scene Viewer (Android,
-- via ARCore) and Apple AR Quick Look (iOS, via ARKit), rendered by the
-- <model-viewer> web component -- no native app code needed.
alter table products
  add column if not exists model_glb_url text,  -- Android (Scene Viewer / ARCore) + desktop 3D preview
  add column if not exists model_usdz_url text; -- iOS (AR Quick Look / ARKit)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-models', 'product-models', true, 30 * 1024 * 1024,
  array['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read (models must load in the browser/OS AR viewer); only the
-- owning seller may upload/manage their product's models.
drop policy if exists "product models public read" on storage.objects;
create policy "product models public read" on storage.objects for select
  using (bucket_id = 'product-models');
drop policy if exists "product models seller write" on storage.objects;
create policy "product models seller write" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-models' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "product models seller update" on storage.objects;
create policy "product models seller update" on storage.objects for update to authenticated
  using (bucket_id = 'product-models' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "product models seller delete" on storage.objects;
create policy "product models seller delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-models' and (storage.foldername(name))[1] = auth.uid()::text);
