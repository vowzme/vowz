---
name: Image Processing
description: Client-side photo compression before R2 upload
type: reference
---
All photo uploads (couples and guests) are compressed in the browser before going to Cloudflare R2: long edge max 2048px, WebP at 0.86 quality (JPEG fallback), original kept if already smaller. Guests upload via r2-upload `guest_upload` (published sites only, images only, 10 MB cap after compression).
