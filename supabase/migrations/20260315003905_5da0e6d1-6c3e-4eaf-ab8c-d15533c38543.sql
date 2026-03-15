-- Enforce single-practitioner mode: one practice_profile per user
ALTER TABLE public.practice_profiles
  ADD CONSTRAINT practice_profiles_user_id_unique UNIQUE (user_id);