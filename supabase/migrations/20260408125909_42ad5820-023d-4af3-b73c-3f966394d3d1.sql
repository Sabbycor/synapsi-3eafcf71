SELECT cron.schedule(
  'send-appointment-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xuxvabqnulwzcjrckjnt.supabase.co/functions/v1/send-appointment-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eHZhYnFudWx3emNqcmNram50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDEyMTksImV4cCI6MjA4ODcxNzIxOX0.YVfarDxHQhCvih01gJIA6KX4742T0xyGjVIWybXJZ-g"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);