CREATE TABLE public.wizard_drafts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  step TEXT NOT NULL DEFAULT 'names',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wizard_drafts TO authenticated;
GRANT ALL ON public.wizard_drafts TO service_role;

ALTER TABLE public.wizard_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own wizard draft"
  ON public.wizard_drafts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER wizard_drafts_set_updated_at
  BEFORE UPDATE ON public.wizard_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();