
-- Budget table (one per wedding site)
CREATE TABLE public.wedding_budget (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  total_budget numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(wedding_site_id)
);

ALTER TABLE public.wedding_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage budget" ON public.wedding_budget
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_budget.wedding_site_id AND wedding_sites.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_budget.wedding_site_id AND wedding_sites.user_id = auth.uid()));

-- Expenses table
CREATE TABLE public.wedding_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  due_date date,
  vendor_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage expenses" ON public.wedding_expenses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_expenses.wedding_site_id AND wedding_sites.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_expenses.wedding_site_id AND wedding_sites.user_id = auth.uid()));

-- Family members table for collaboration
CREATE TABLE public.wedding_family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'viewer',
  access_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage family members" ON public.wedding_family_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_family_members.wedding_site_id AND wedding_sites.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_family_members.wedding_site_id AND wedding_sites.user_id = auth.uid()));

-- Reminders table
CREATE TABLE public.wedding_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_site_id uuid NOT NULL REFERENCES public.wedding_sites(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  remind_at timestamptz NOT NULL,
  reminder_type text NOT NULL DEFAULT 'task',
  is_sent boolean NOT NULL DEFAULT false,
  related_expense_id uuid REFERENCES public.wedding_expenses(id) ON DELETE SET NULL,
  related_checklist_id uuid REFERENCES public.wedding_checklist(id) ON DELETE SET NULL,
  notify_family boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage reminders" ON public.wedding_reminders
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_reminders.wedding_site_id AND wedding_sites.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM wedding_sites WHERE wedding_sites.id = wedding_reminders.wedding_site_id AND wedding_sites.user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_wedding_budget_updated_at BEFORE UPDATE ON public.wedding_budget FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_wedding_expenses_updated_at BEFORE UPDATE ON public.wedding_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
