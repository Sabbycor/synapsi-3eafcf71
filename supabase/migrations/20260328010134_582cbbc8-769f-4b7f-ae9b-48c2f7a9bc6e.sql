
-- Enable the http extension for making HTTP calls from PL/pgSQL
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create the trigger function for welcome email
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url TEXT;
  request_payload JSONB;
BEGIN
  -- Build the Edge Function URL using the known project ref
  edge_function_url := 'https://xuxvabqnulwzcjrckjnt.supabase.co/functions/v1/send-email';

  request_payload := jsonb_build_object(
    'template_id', 'welcome',
    'to', jsonb_build_object(
      'email', NEW.email,
      'name', COALESCE(NEW.full_name, 'Professionista')
    ),
    'params', jsonb_build_object(
      'first_name', COALESCE(SPLIT_PART(NEW.full_name, ' ', 1), 'Professionista'),
      'dashboard_url', 'https://synapsi.app/dashboard'
    )
  );

  -- Fire-and-forget HTTP POST to the Edge Function
  PERFORM extensions.http((
    'POST',
    edge_function_url,
    ARRAY[extensions.http_header('Content-Type', 'application/json')],
    'application/json',
    request_payload::text
  )::extensions.http_request);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user signup if email fails
  RAISE WARNING 'Welcome email failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create the trigger on public.users
CREATE TRIGGER on_new_user_send_welcome_email
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_welcome_email();
