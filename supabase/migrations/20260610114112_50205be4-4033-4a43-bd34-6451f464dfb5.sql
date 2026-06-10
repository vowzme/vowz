-- Defense-in-depth: ensure anon role cannot read sensitive columns on wedding_family_members
REVOKE SELECT (email, phone) ON public.wedding_family_members FROM anon;

-- Ensure anon cannot read payment_config at all
REVOKE SELECT ON public.payment_config FROM anon;