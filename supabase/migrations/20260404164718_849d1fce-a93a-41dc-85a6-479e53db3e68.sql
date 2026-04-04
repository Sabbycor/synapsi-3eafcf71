CREATE OR REPLACE FUNCTION public.handle_new_user_sync_brevo_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  edge_function_url TEXT;
  request_payload JSONB;
BEGIN
  edge_function_url := 'https://xuxvabqnulwzcjrckjnt.supabase.co/functions/v1/brevo-sync-contact';

  request_payload := jsonb_build_object(
    'email', NEW.email,
    'full_name', COALESCE(NEW.full_name, ''),
    'created_at', COALESCE(NEW.created_at::text, now()::text)
  );

  PERFORM extensions.http((
    'POST',
    edge_function_url,
    ARRAY[extensions.http_header('Content-Type', 'application/json')],
    'application/json',
    request_payload::text
  )::extensions.http_request);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Brevo contact sync failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_user_sync_brevo_contact
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_sync_brevo_contact();