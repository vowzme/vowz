---
name: Storage Architecture
description: Cloudflare R2 is the sole media storage backend; Google Drive integration removed
type: feature
---
- **Sole storage**: Cloudflare R2 via `r2-upload` edge function (S3-compatible, AWS SigV4 signed with `aws4fetch`).
- Secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- Files namespaced by `{user_id}/{filename}` for organization + delete authorization.
- Public URLs served from `R2_PUBLIC_URL` (R2.dev or custom domain). Zero egress cost.
- `useMediaUpload` → `useR2Upload`. Compression: max 2048px, 0.82 quality.
- Bucket CORS must allow vowz.me, www.vowz.me, vowz.lovable.app, localhost:5173.
- **Google Drive integration removed**: `user_google_drive` table dropped, `google-drive` edge function deleted, `useGoogleDrive` hook + `GoogleDriveLinkCard` + `DriveFileBrowser` components removed. Onboarding wizard no longer has a Storage step.
- Legacy Supabase Storage buckets (wedding-photos, wedding-logos, blessing-photos, email-assets) retained for old assets; admins can run `migrate-to-r2` from Admin Settings to move them.
