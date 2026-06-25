
CREATE OR REPLACE FUNCTION public.user_has_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND plan IN ('premium', 'premium_6mo', 'premium_yearly')
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_premium_card_template()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_premium boolean;
BEGIN
  SELECT is_premium INTO _is_premium
  FROM public.card_templates
  WHERE slug = NEW.template_slug;

  IF COALESCE(_is_premium, false) = true THEN
    IF NOT public.is_admin(NEW.user_id) AND NOT public.user_has_premium(NEW.user_id) THEN
      RAISE EXCEPTION 'Premium template "%" requires an active premium subscription', NEW.template_slug
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_premium_card_template_trg ON public.invitation_card_variants;
CREATE TRIGGER enforce_premium_card_template_trg
BEFORE INSERT OR UPDATE OF template_slug ON public.invitation_card_variants
FOR EACH ROW EXECUTE FUNCTION public.enforce_premium_card_template();
