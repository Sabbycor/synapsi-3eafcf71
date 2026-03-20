ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS bank_reference text;