ALTER TABLE public.wedding_checklist
  ADD COLUMN IF NOT EXISTS reminder_flags jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS wedding_checklist_due_pending_idx
  ON public.wedding_checklist (due_date)
  WHERE is_completed = false AND due_date IS NOT NULL;