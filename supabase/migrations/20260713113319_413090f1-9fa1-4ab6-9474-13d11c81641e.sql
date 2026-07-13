-- Internal email-queue plumbing: service role only
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

-- Trigger-only functions (Postgres invokes them directly; nothing should call via API)
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hash_site_password() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_premium_card_template() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_affiliate_immutable_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.r2_files_sync_usage() FROM PUBLIC, anon, authenticated;

-- Auth-required helpers: allow authenticated only
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.user_has_premium(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_premium(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.check_ai_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_storage_quota(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_storage_quota(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_family_member_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_family_member_token(uuid) TO authenticated;

-- Public-facing helpers stay callable (anon + authenticated) — no changes needed:
--   check_slug_available, site_has_password, verify_site_password,
--   verify_family_member_token, validate_coupon_for_redemption,
--   lookup_affiliate_by_code, update_rsvp_by_token, get_template_popularity