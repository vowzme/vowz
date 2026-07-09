DROP TRIGGER IF EXISTS trg_enforce_affiliate_immutable_fields ON public.affiliates;
CREATE TRIGGER trg_enforce_affiliate_immutable_fields
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.enforce_affiliate_immutable_fields();