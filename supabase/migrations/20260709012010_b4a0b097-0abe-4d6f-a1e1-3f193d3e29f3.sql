
-- Reconcile trigger: keep r2_storage_usage in perfect sync with r2_files.

CREATE OR REPLACE FUNCTION public.r2_files_sync_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.r2_storage_usage (user_id, used_bytes, file_count, updated_at)
    VALUES (NEW.user_id, GREATEST(NEW.size_bytes, 0), 1, now())
    ON CONFLICT (user_id) DO UPDATE
      SET used_bytes = public.r2_storage_usage.used_bytes + GREATEST(NEW.size_bytes, 0),
          file_count = public.r2_storage_usage.file_count + 1,
          updated_at = now();

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.r2_storage_usage (user_id, used_bytes, file_count, updated_at)
    VALUES (OLD.user_id, 0, 0, now())
    ON CONFLICT (user_id) DO UPDATE
      SET used_bytes = GREATEST(public.r2_storage_usage.used_bytes - GREATEST(OLD.size_bytes, 0), 0),
          file_count = GREATEST(public.r2_storage_usage.file_count - 1, 0),
          updated_at = now();

  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      -- Remove from old owner
      INSERT INTO public.r2_storage_usage (user_id, used_bytes, file_count, updated_at)
      VALUES (OLD.user_id, 0, 0, now())
      ON CONFLICT (user_id) DO UPDATE
        SET used_bytes = GREATEST(public.r2_storage_usage.used_bytes - GREATEST(OLD.size_bytes, 0), 0),
            file_count = GREATEST(public.r2_storage_usage.file_count - 1, 0),
            updated_at = now();
      -- Add to new owner
      INSERT INTO public.r2_storage_usage (user_id, used_bytes, file_count, updated_at)
      VALUES (NEW.user_id, GREATEST(NEW.size_bytes, 0), 1, now())
      ON CONFLICT (user_id) DO UPDATE
        SET used_bytes = public.r2_storage_usage.used_bytes + GREATEST(NEW.size_bytes, 0),
            file_count = public.r2_storage_usage.file_count + 1,
            updated_at = now();
    ELSIF NEW.size_bytes IS DISTINCT FROM OLD.size_bytes THEN
      INSERT INTO public.r2_storage_usage (user_id, used_bytes, file_count, updated_at)
      VALUES (NEW.user_id, GREATEST(NEW.size_bytes - OLD.size_bytes, -public.r2_storage_usage.used_bytes), 0, now())
      ON CONFLICT (user_id) DO UPDATE
        SET used_bytes = GREATEST(public.r2_storage_usage.used_bytes + (GREATEST(NEW.size_bytes, 0) - GREATEST(OLD.size_bytes, 0)), 0),
            updated_at = now();
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_r2_files_sync_usage ON public.r2_files;
CREATE TRIGGER trg_r2_files_sync_usage
AFTER INSERT OR UPDATE OR DELETE ON public.r2_files
FOR EACH ROW EXECUTE FUNCTION public.r2_files_sync_usage();

-- One-shot backfill so counters start accurate.
WITH totals AS (
  SELECT user_id,
         COALESCE(SUM(GREATEST(size_bytes, 0)), 0)::bigint AS used_bytes,
         COUNT(*)::int AS file_count
  FROM public.r2_files
  GROUP BY user_id
)
INSERT INTO public.r2_storage_usage (user_id, used_bytes, file_count, updated_at)
SELECT user_id, used_bytes, file_count, now() FROM totals
ON CONFLICT (user_id) DO UPDATE
  SET used_bytes = EXCLUDED.used_bytes,
      file_count = EXCLUDED.file_count,
      updated_at = now();

-- Zero-out rows for users whose files were all deleted.
UPDATE public.r2_storage_usage u
SET used_bytes = 0, file_count = 0, updated_at = now()
WHERE NOT EXISTS (SELECT 1 FROM public.r2_files f WHERE f.user_id = u.user_id)
  AND (u.used_bytes <> 0 OR u.file_count <> 0);
