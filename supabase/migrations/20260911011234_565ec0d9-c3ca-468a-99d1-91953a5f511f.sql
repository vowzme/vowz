CREATE TABLE public.user_luxe_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  provider text NOT NULL DEFAULT 'razorpay',
  payment_id text,
  payment_order_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_luxe_unlocks_payment_order_idx ON public.user_luxe_unlocks (payment_order_id) WHERE payment_order_id IS NOT NULL;
CREATE INDEX user_luxe_unlocks_user_idx ON public.user_luxe_unlocks (user_id);

GRANT SELECT ON public.user_luxe_unlocks TO authenticated;
GRANT ALL ON public.user_luxe_unlocks TO service_role;
ALTER TABLE public.user_luxe_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own luxe unlocks"
  ON public.user_luxe_unlocks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.user_has_luxe(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_luxe_unlocks
    WHERE user_id = _user_id AND status = 'active'
  );
$$;

ALTER TABLE public.card_templates
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'standard';

ALTER TABLE public.invitation_card_variants
  ADD COLUMN IF NOT EXISTS reveal text,
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS invitation_card_variants_share_token_idx
  ON public.invitation_card_variants (share_token);

CREATE OR REPLACE FUNCTION public.enforce_premium_card_template()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_premium boolean;
  _tier text;
BEGIN
  SELECT is_premium, tier INTO _is_premium, _tier
  FROM public.card_templates
  WHERE slug = NEW.template_slug;

  IF COALESCE(_tier, 'standard') = 'luxe' THEN
    IF NOT public.is_admin(NEW.user_id) AND NOT public.user_has_luxe(NEW.user_id) THEN
      RAISE EXCEPTION 'LUXE template "%" requires the LUXE unlock', NEW.template_slug
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF COALESCE(_is_premium, false) = true THEN
    IF NOT public.is_admin(NEW.user_id) AND NOT public.user_has_premium(NEW.user_id) THEN
      RAISE EXCEPTION 'Premium template "%" requires an active premium subscription', NEW.template_slug
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_card(_token uuid)
RETURNS TABLE(
  id uuid,
  name text,
  template_slug text,
  data jsonb,
  theme_overrides jsonb,
  pages jsonb,
  photo_url text,
  reveal text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT v.id, v.name, v.template_slug, v.data, v.theme_overrides, v.pages, v.photo_url, v.reveal
  FROM public.invitation_card_variants v
  WHERE v.share_token = _token AND v.share_enabled = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_card(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_luxe(uuid) TO anon, authenticated;