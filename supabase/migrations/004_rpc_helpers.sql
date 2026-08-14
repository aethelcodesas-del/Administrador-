-- 004_rpc_helpers.sql
-- Database Helper Functions for Central Admin Operations

-- Create extension pgcrypto if not exists (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

/**
 * RPC Function to securely create a new user account in Supabase Auth from the PostgreSQL backend.
 * Runs with SECURITY DEFINER privileges to write to the auth schema safely.
 */
CREATE OR REPLACE FUNCTION public.create_client_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_client_id VARCHAR
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  profile_id UUID;
BEGIN
  -- Validate uniqueness of email first
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'El correo electrónico % ya está registrado.', p_email;
  END IF;

  -- 1. Insert into auth.users (Supabase Auth internal table)
  INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_metadata, 
    created_at, 
    updated_at,
    is_sso_user
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('first_name', p_first_name, 'last_name', p_last_name)::jsonb,
    now(),
    now(),
    false
  )
  RETURNING id INTO new_user_id;

  -- 2. Wait or ensure profile is populated by on_auth_user_created trigger.
  -- If trigger didn't run, create profile manually
  SELECT id INTO profile_id FROM public.profiles WHERE auth_user_id = new_user_id;
  
  IF profile_id IS NULL THEN
    INSERT INTO public.profiles (auth_user_id, email, first_name, last_name, status, client_id)
    VALUES (new_user_id, p_email, p_first_name, p_last_name, 'Activo', p_client_id)
    RETURNING id INTO profile_id;
    
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (profile_id, 'admin')
    ON CONFLICT (user_id, role_id) DO NOTHING;
  ELSE
    -- Update client_id of auto-created profile
    UPDATE public.profiles
    SET client_id = p_client_id
    WHERE id = profile_id;

    -- Update role to admin (client admin)
    UPDATE public.user_roles
    SET role_id = 'admin'
    WHERE user_id = profile_id;
  END IF;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
