
-- Fix all RESTRICTIVE RLS policies to PERMISSIVE

-- practice_profiles
DROP POLICY IF EXISTS "practice_profiles_all_own" ON public.practice_profiles;
CREATE POLICY "practice_profiles_all_own" ON public.practice_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- patients
DROP POLICY IF EXISTS "patients_all_own_practice" ON public.patients;
CREATE POLICY "patients_all_own_practice" ON public.patients
  FOR ALL TO authenticated
  USING (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()))
  WITH CHECK (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()));

-- appointments
DROP POLICY IF EXISTS "appointments_all_own_practice" ON public.appointments;
CREATE POLICY "appointments_all_own_practice" ON public.appointments
  FOR ALL TO authenticated
  USING (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()))
  WITH CHECK (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()));

-- invoices
DROP POLICY IF EXISTS "invoices_all_own_practice" ON public.invoices;
CREATE POLICY "invoices_all_own_practice" ON public.invoices
  FOR ALL TO authenticated
  USING (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()))
  WITH CHECK (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()));

-- invoice_items
DROP POLICY IF EXISTS "invoice_items_all_own" ON public.invoice_items;
CREATE POLICY "invoice_items_all_own" ON public.invoice_items
  FOR ALL TO authenticated
  USING (invoice_id IN (SELECT i.id FROM invoices i JOIN practice_profiles pp ON pp.id = i.practice_profile_id WHERE pp.user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT i.id FROM invoices i JOIN practice_profiles pp ON pp.id = i.practice_profile_id WHERE pp.user_id = auth.uid()));

-- payments
DROP POLICY IF EXISTS "payments_all_own" ON public.payments;
CREATE POLICY "payments_all_own" ON public.payments
  FOR ALL TO authenticated
  USING (invoice_id IN (SELECT i.id FROM invoices i JOIN practice_profiles pp ON pp.id = i.practice_profile_id WHERE pp.user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT i.id FROM invoices i JOIN practice_profiles pp ON pp.id = i.practice_profile_id WHERE pp.user_id = auth.uid()));

-- tasks
DROP POLICY IF EXISTS "tasks_all_own_practice" ON public.tasks;
CREATE POLICY "tasks_all_own_practice" ON public.tasks
  FOR ALL TO authenticated
  USING (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()))
  WITH CHECK (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()));

-- reminders
DROP POLICY IF EXISTS "reminders_all_own_practice" ON public.reminders;
CREATE POLICY "reminders_all_own_practice" ON public.reminders
  FOR ALL TO authenticated
  USING (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()))
  WITH CHECK (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()));

-- service_records
DROP POLICY IF EXISTS "service_records_all_own_practice" ON public.service_records;
CREATE POLICY "service_records_all_own_practice" ON public.service_records
  FOR ALL TO authenticated
  USING (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()))
  WITH CHECK (practice_profile_id IN (SELECT id FROM practice_profiles WHERE user_id = auth.uid()));

-- patient_consents
DROP POLICY IF EXISTS "patient_consents_all_own" ON public.patient_consents;
CREATE POLICY "patient_consents_all_own" ON public.patient_consents
  FOR ALL TO authenticated
  USING (patient_id IN (SELECT p.id FROM patients p JOIN practice_profiles pp ON pp.id = p.practice_profile_id WHERE pp.user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT p.id FROM patients p JOIN practice_profiles pp ON pp.id = p.practice_profile_id WHERE pp.user_id = auth.uid()));

-- users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (actor_user_id = auth.uid());

DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

-- Ensure handle_new_user trigger exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
