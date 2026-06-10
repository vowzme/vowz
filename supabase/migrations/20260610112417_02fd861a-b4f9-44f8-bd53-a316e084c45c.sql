-- Revoke SELECT on sensitive columns so they are never returned via PostgREST,
-- even when RLS policies permit row-level reads.

-- 1) wedding_family_members.access_token_hash
REVOKE SELECT (access_token_hash) ON public.wedding_family_members FROM anon, authenticated;

-- 2) wedding_site_passwords.password
REVOKE SELECT (password) ON public.wedding_site_passwords FROM anon, authenticated;
