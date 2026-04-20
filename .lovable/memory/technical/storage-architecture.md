---
name: Storage Architecture
description: Cloudflare R2 is the primary media storage. Google Drive is optional. Edge function r2-upload uses S3 SigV4 via aws4fetch.
type: feature
---
- **Primary storage**: Cloudflare R2 via `r2-upload` edge function (S3-compatible, AWS SigV4 signed with `aws4fetch`).
- Secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- Files namespaced by `{user_id}/{filename}` for organization + delete authorization.
- Public URLs served from `R2_PUBLIC_URL` (R2.dev or custom domain). Zero egress cost.
- **Google Drive is optional** (no longer mandatory). `useGoogleDrive` hook still exists for users who want a personal Drive backup browser.
- `useMediaUpload` always routes to R2 first via `useR2Upload`. Compression unchanged (max 2048px, 0.82 quality).
- Bucket CORS must allow vowz.me, www.vowz.me, vowz.lovable.app, localhost:5173.
