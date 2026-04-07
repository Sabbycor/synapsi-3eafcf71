ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

UPDATE public.users
SET trial_end_date = created_at + INTERVAL '14 days'
WHERE trial_end_date IS NULL;