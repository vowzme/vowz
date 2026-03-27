-- Table to store Google Drive OAuth tokens per user
CREATE TABLE public.user_google_drive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  drive_email text,
  drive_folder_id text,
  is_linked boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_google_drive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drive link"
  ON public.user_google_drive FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own drive link"
  ON public.user_google_drive FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own drive link"
  ON public.user_google_drive FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own drive link"
  ON public.user_google_drive FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access"
  ON public.user_google_drive FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_user_google_drive_updated_at
  BEFORE UPDATE ON public.user_google_drive
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();