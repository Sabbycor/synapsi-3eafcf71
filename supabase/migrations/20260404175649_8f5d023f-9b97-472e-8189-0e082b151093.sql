
-- 1. Add billing_month to invoices
ALTER TABLE public.invoices ADD COLUMN billing_month date;

-- 2. Add invoice_id to service_records (inverse relation)
ALTER TABLE public.service_records ADD COLUMN invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;

-- 3. Deprecate service_record_id on invoices
COMMENT ON COLUMN public.invoices.service_record_id IS 'DEPRECATED: usare invoice_id su service_records';
