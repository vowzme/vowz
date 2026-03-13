-- Create user subscriptions table for premium upgrades
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'premium_yearly',
  provider TEXT NOT NULL DEFAULT 'razorpay',
  status TEXT NOT NULL DEFAULT 'pending',
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_order_id TEXT,
  payment_id TEXT,
  payment_signature TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_subscriptions_order_id_unique UNIQUE (payment_order_id),
  CONSTRAINT user_subscriptions_payment_id_unique UNIQUE (payment_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON public.user_subscriptions(expires_at);

-- At most one active premium subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_one_active
ON public.user_subscriptions(user_id)
WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can read own subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can read all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Service role writes subscription records from backend payment verification
CREATE POLICY "Service role can insert subscriptions"
ON public.user_subscriptions
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Keep updated_at current
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();