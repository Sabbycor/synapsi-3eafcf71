ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;