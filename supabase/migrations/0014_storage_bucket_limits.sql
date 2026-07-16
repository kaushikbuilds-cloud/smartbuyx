-- SmartBuyX — enforce file size and MIME type limits server-side on storage
-- buckets. Neither was set when these buckets were created, so uploads had
-- no server-enforced size cap and no type restriction beyond whatever the
-- browser's file picker "accept" attribute suggested (a client-side hint
-- only, not a real restriction — bypassable by anyone calling the Storage
-- API directly).

update storage.buckets
set file_size_limit = 10 * 1024 * 1024, -- 10 MB, plenty for product photos
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';

update storage.buckets
set file_size_limit = 50 * 1024 * 1024, -- 50 MB, return proof can be a short video
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'return-proof';
