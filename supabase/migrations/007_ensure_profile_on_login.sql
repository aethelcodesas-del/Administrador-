-- 007_ensure_profile_on_login.sql
-- Garantiza que todo usuario autenticado tenga un perfil y un rol asignado.
-- Resuelve el problema de timing: el trigger on_auth_user_created puede no
-- haber completado antes de que el frontend consulte el perfil.
--
-- Esta función se llama desde el frontend con supabase.rpc('ensure_profile_exists')
-- justo después del signUp, antes de intentar el login automático.
-- Corre con SECURITY DEFINER para poder insertar en profiles y user_roles
-- independientemente de las políticas RLS actuales.

CREATE OR REPLACE FUNCTION public.ensure_profile_exists(
  p_auth_user_id UUID,
  p_email        TEXT,
  p_first_name   TEXT DEFAULT '',
  p_last_name    TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_role_id    TEXT;
BEGIN
  -- 1. Buscar perfil existente
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE auth_user_id = p_auth_user_id;

  -- 2. Si no existe (el trigger no corrió a tiempo), crear perfil
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (
      auth_user_id,
      email,
      first_name,
      last_name,
      status
    )
    VALUES (
      p_auth_user_id,
      LOWER(TRIM(p_email)),
      COALESCE(NULLIF(TRIM(p_first_name), ''), SPLIT_PART(p_email, '@', 1)),
      COALESCE(NULLIF(TRIM(p_last_name), ''), ''),
      'Activo'
    )
    RETURNING id INTO v_profile_id;
  ELSE
    -- Asegurarse que el email esté normalizado
    UPDATE public.profiles
    SET
      email      = LOWER(TRIM(p_email)),
      first_name = CASE WHEN first_name IS NULL OR first_name = '' THEN COALESCE(NULLIF(TRIM(p_first_name), ''), SPLIT_PART(p_email, '@', 1)) ELSE first_name END,
      status     = CASE WHEN status IS NULL THEN 'Activo' ELSE status END,
      updated_at = now()
    WHERE id = v_profile_id;
  END IF;

  -- 3. Garantizar que el usuario tiene un rol asignado
  SELECT role_id INTO v_role_id
  FROM public.user_roles
  WHERE user_id = v_profile_id
  LIMIT 1;

  IF v_role_id IS NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_profile_id, 'super_admin')
    ON CONFLICT (user_id, role_id) DO NOTHING;
    v_role_id := 'super_admin';
  END IF;

  -- 4. Devolver resumen para que el frontend pueda registrar el resultado
  RETURN json_build_object(
    'profile_id',   v_profile_id,
    'auth_user_id', p_auth_user_id,
    'role_id',      v_role_id,
    'status',       'ok'
  );
END;
$$;

-- Asegurarse que cualquier usuario autenticado puede llamar esta función
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(UUID, TEXT, TEXT, TEXT) TO anon;
