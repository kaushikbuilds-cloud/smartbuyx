# File Uploads Security Report

## Status: MEDIUM (finding, fixed)

## Findings

Two upload paths exist, both client-side direct-to-Supabase-Storage (browser → Storage API, no Server Action in between): `image-uploader.tsx` (seller product photos, `product-images` bucket) and `return-proof-uploader.tsx` (buyer return proof photo/video, `return-proof` bucket). A third path (`image-enhancement.ts`) uploads AI-enhanced images server-side with an explicit `contentType: "image/png"`.

Checked against each audit verification goal:

- **File type validated by magic bytes, not extension?** Neither — validation was client-side only (`accept="image/*"` on the `<input type="file">`, a UI hint that doesn't restrict what actually gets uploaded via the Storage API) and the storage buckets themselves had **no `allowed_mime_types` set at all**. Anyone calling the Supabase Storage API directly (not through the UI) could upload any file type.
- **Files renamed to UUIDs server-side?** Yes — both upload components already do `` `${crypto.randomUUID()}.${ext}` ``, so no attacker-controlled filename ever reaches storage, and there's no path-traversal or double-extension surface.
- **Files stored on a separate domain/bucket?** Yes, structurally — Supabase Storage serves from `*.supabase.co`, a different origin than the app (`smartbuyx.in`). This matters a lot for the classic "upload an HTML/SVG file with an embedded `<script>`, get someone to open it" attack: even if such a file were uploaded, it would execute in the Storage bucket's origin, not the app's — it can't read the app's session cookie or DOM, because same-origin policy blocks it. Uploaded SVGs specifically are additionally safe when rendered via `<img>`/`next/image` (the img context doesn't execute embedded `<script>` tags in SVGs per spec, regardless of origin).
- **Size limits enforced server-side?** No — neither bucket had a `file_size_limit` set, meaning nothing prevented a very large upload (storage cost/quota abuse), and there was no MIME allowlist either.

## What's at risk

Before the fix: unrestricted file size (storage cost abuse) and unrestricted file type at the infrastructure level (mitigated in practice by the separate-origin serving, but still worth closing — a `allowed_mime_types` restriction is the correct place to enforce this, not client-side hints).

## What's already secure

- Server-controlled random filenames (no path traversal, no user-controlled naming).
- Cross-origin storage serving significantly reduces the impact of any type-confusion issue that might slip through.

## Recommendations

**Applied** — migration `0014_storage_bucket_limits.sql` sets `file_size_limit` (10 MB for `product-images`, 50 MB for `return-proof` to allow short videos) and `allowed_mime_types` (JPEG/PNG/WebP for product images; those plus MP4/WebM/QuickTime for return proof) directly on both Supabase Storage buckets — this is enforced by Supabase's Storage API itself, not just app code, so it holds even against a caller that bypasses the UI entirely.

**Not implemented, noted as a reasonable follow-up:** true magic-byte (file signature) validation. Supabase's `allowed_mime_types` checks the `Content-Type` the uploading client declares, which is still technically spoofable by a client calling the Storage API directly with a false `Content-Type` header — a determined attacker could still get a mismatched file past this check. Real magic-byte validation would need a server-side inspection step (e.g., an Edge Function reading the first few bytes against known file signatures before allowing the object to be finalized), which is a larger change not implemented in this pass. Given the cross-origin storage serving already neutralizes the most realistic exploit path (script execution against this app's origin), this is a reasonable place to stop for now.
