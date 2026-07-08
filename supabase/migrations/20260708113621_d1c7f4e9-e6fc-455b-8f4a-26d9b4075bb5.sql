
-- Replace TOCTOU-prone WITH CHECK subqueries with a BEFORE UPDATE trigger
-- that pins immutable fields to OLD values within the same transaction row snapshot.

DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;

CREATE POLICY "Affiliates can update own record"
ON public.affiliates
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_affiliate_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass immutability protection (they use the admin update policy).
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Force immutable fields back to OLD row values.
  NEW.is_franchise         := OLD.is_franchise;
  NEW.franchise_approved   := OLD.franchise_approved;
  NEW.franchise_id         := OLD.franchise_id;
  NEW.total_earnings       := OLD.total_earnings;
  NEW.pending_earnings     := OLD.pending_earnings;
  NEW.paid_earnings        := OLD.paid_earnings;
  NEW.total_referrals      := OLD.total_referrals;
  NEW.successful_referrals := OLD.successful_referrals;
  NEW.referral_code        := OLD.referral_code;
  NEW.user_id              := OLD.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_affiliate_immutable_fields ON public.affiliates;
CREATE TRIGGER trg_enforce_affiliate_immutable_fields
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.enforce_affiliate_immutable_fields();
