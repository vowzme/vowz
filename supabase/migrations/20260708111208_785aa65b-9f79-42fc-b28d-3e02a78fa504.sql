
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_fn_time
  ON public.ai_usage_log (user_id, function_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  _user_id uuid,
  _function_name text,
  _per_hour int DEFAULT 20,
  _per_day int DEFAULT 100
)
RETURNS TABLE(allowed boolean, hour_count int, day_count int, retry_after_seconds int)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hour int;
  _day int;
  _oldest_in_hour timestamptz;
BEGIN
  -- Admins bypass entirely
  IF public.is_admin(_user_id) THEN
    RETURN QUERY SELECT true, 0, 0, 0;
    RETURN;
  END IF;

  SELECT count(*)::int INTO _hour
    FROM public.ai_usage_log
   WHERE user_id = _user_id
     AND function_name = _function_name
     AND created_at > now() - interval '1 hour';

  SELECT count(*)::int INTO _day
    FROM public.ai_usage_log
   WHERE user_id = _user_id
     AND function_name = _function_name
     AND created_at > now() - interval '1 day';

  IF _hour >= _per_hour OR _day >= _per_day THEN
    SELECT min(created_at) INTO _oldest_in_hour
      FROM public.ai_usage_log
     WHERE user_id = _user_id
       AND function_name = _function_name
       AND created_at > now() - interval '1 hour';

    RETURN QUERY SELECT
      false,
      _hour,
      _day,
      GREATEST(1, EXTRACT(EPOCH FROM (COALESCE(_oldest_in_hour, now()) + interval '1 hour' - now()))::int);
    RETURN;
  END IF;

  RETURN QUERY SELECT true, _hour, _day, 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, int, int) TO authenticated, service_role;
