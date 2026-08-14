-- ================================================================
-- 009_complete_auth_fix.sql
-- CORRECCIÓN COMPLETA Y DEFINITIVA DEL SISTEMA DE AUTENTICACIÓN
--
-- RESUELVE:
-- 1. infinite recursion in policy for relation "profiles"
-- 2. Usuario creado en Auth pero perfil no creado
-- 3. Login falla después de registro
--
-- INSTRUCCIÓN: Ejecutar TODO este bloque en Supabase → SQL Editor
-- ================================================================


-- ================================================================
-- PARTE 1: CORREGIR current_user_has_role (recursión infinita)
-- La función leía profiles dentro de una política RLS de profiles
-- → recursión. SET LOCAL row_security = off la rompe.
-- ================================================================
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result BOOLEAN := FALSE;
BEGIN
  SET LOCAL row_security = off;
  SELECT EXISTS (
    SELECT 1
    FROM   public.user_roles ur
    JOIN   public.profiles   p  ON ur.user_id = p.id
    WHERE  p.auth_user_id = auth.uid()
      AND  ur.role_id = required_role
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(VARCHAR) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_has_role(VARCHAR) FROM anon;


-- ================================================================
-- PARTE 2: REEMPLAZAR POLÍTICAS RECURSIVAS DE profiles
-- ================================================================

-- Eliminar todas las políticas existentes en profiles
DROP POLICY IF EXISTS "Allow read access to own profile"                     ON public.profiles;
DROP POLICY IF EXISTS "Allow update to own profile"                          ON public.profiles;
DROP POLICY IF EXISTS "Super admin and client admin full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"                                  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"                                  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_superadmin"                           ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_superadmin"                           ON public.profiles;

-- SELECT: propio perfil, super_admin y admin ven todos
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = auth_user_id
    OR public.current_user_has_role('super_admin')
    OR public.current_user_has_role('admin')
  );

-- UPDATE: propio perfil y super_admin
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING      (auth.uid() = auth_user_id OR public.current_user_has_role('super_admin'))
  WITH CHECK (auth.uid() = auth_user_id OR public.current_user_has_role('super_admin'));

-- INSERT: solo super_admin (el trigger usa SECURITY DEFINER y no necesita política)
CREATE POLICY "profiles_insert_superadmin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('super_admin'));

-- DELETE: solo super_admin
CREATE POLICY "profiles_delete_superadmin"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.current_user_has_role('super_admin'));


-- ================================================================
-- PARTE 3: RPC get_profile_by_auth_id
-- El frontend ahora llama esta función en vez de hacer SELECT
-- directo en profiles. Corre con row_security=off → nunca recursa.
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_profile_by_auth_id(p_auth_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SET LOCAL row_security = off;

  SELECT json_build_object(
    'id',          p.id,
    'auth_user_id',p.auth_user_id,
    'first_name',  p.first_name,
    'last_name',   p.last_name,
    'email',       p.email,
    'phone',       p.phone,
    'avatar_url',  p.avatar_url,
    'status',      p.status,
    'client_id',   p.client_id,
    'campaign_id', p.campaign_id,
    'created_at',  p.created_at,
    'updated_at',  p.updated_at,
    'role_id',     (SELECT ur.role_id FROM public.user_roles ur WHERE ur.user_id = p.id ORDER BY ur.created_at LIMIT 1),
    'client_name', (SELECT c.name      FROM public.clients    c  WHERE c.id = p.client_id LIMIT 1)
  )
  INTO v_result
  FROM public.profiles p
  WHERE p.auth_user_id = p_auth_user_id;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_profile_by_auth_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_by_auth_id(UUID) TO anon;


-- ================================================================
-- PARTE 4: RPC ensure_profile_exists
-- Garantiza que el perfil existe después del signUp.
-- Si el trigger on_auth_user_created falló o llegó tarde, lo crea.
-- ================================================================
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
  SET LOCAL row_security = off;

  -- 1. Buscar perfil existente
  SELECT id INTO v_profile_id
  FROM   public.profiles
  WHERE  auth_user_id = p_auth_user_id;

  -- 2. Si no existe, crear perfil
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (auth_user_id, email, first_name, last_name, status)
    VALUES (
      p_auth_user_id,
      LOWER(TRIM(p_email)),
      COALESCE(NULLIF(TRIM(p_first_name), ''), SPLIT_PART(p_email, '@', 1)),
      COALESCE(NULLIF(TRIM(p_last_name),  ''), ''),
      'Activo'
    )
    RETURNING id INTO v_profile_id;
  ELSE
    -- Completar datos faltantes si existen
    UPDATE public.profiles
    SET
      first_name = CASE WHEN (first_name IS NULL OR first_name = '') THEN COALESCE(NULLIF(TRIM(p_first_name), ''), SPLIT_PART(p_email, '@', 1)) ELSE first_name END,
      status     = COALESCE(status, 'Activo'),
      updated_at = now()
    WHERE id = v_profile_id;
  END IF;

  -- 3. Garantizar que tiene rol
  SELECT role_id INTO v_role_id
  FROM   public.user_roles
  WHERE  user_id = v_profile_id
  LIMIT  1;

  IF v_role_id IS NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_profile_id, 'super_admin')
    ON CONFLICT (user_id, role_id) DO NOTHING;
    v_role_id := 'super_admin';
  END IF;

  RETURN json_build_object(
    'profile_id',   v_profile_id,
    'auth_user_id', p_auth_user_id,
    'role_id',      v_role_id,
    'status',       'ok'
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(UUID, TEXT, TEXT, TEXT) TO anon;


-- ================================================================
-- PARTE 5: REPARAR usuario existente sin perfil
-- El usuario oberosorio21@gmail.com fue creado en Auth pero
-- no tiene perfil porque el trigger falló por la recursión.
-- Este bloque lo crea/completa automáticamente.
-- ================================================================
DO $$
DECLARE
  v_auth_id    UUID;
  v_profile_id UUID;
BEGIN
  -- Buscar el auth_user_id del correo
  SELECT id INTO v_auth_id
  FROM   auth.users
  WHERE  email = 'oberosorio21@gmail.com'
  LIMIT  1;

  IF v_auth_id IS NULL THEN
    RAISE NOTICE 'Usuario oberosorio21@gmail.com no encontrado en auth.users. Nada que reparar.';
    RETURN;
  END IF;

  -- Verificar si ya tiene perfil
  SELECT id INTO v_profile_id
  FROM   public.profiles
  WHERE  auth_user_id = v_auth_id;

  IF v_profile_id IS NULL THEN
    -- Crear perfil
    INSERT INTO public.profiles (auth_user_id, email, first_name, last_name, status)
    VALUES (v_auth_id, 'oberosorio21@gmail.com', 'Ober', 'Osorio', 'Activo')
    RETURNING id INTO v_profile_id;
    RAISE NOTICE 'Perfil creado para oberosorio21@gmail.com con id=%', v_profile_id;
  ELSE
    RAISE NOTICE 'Perfil ya existe para oberosorio21@gmail.com con id=%', v_profile_id;
  END IF;

  -- Garantizar rol super_admin
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_profile_id, 'super_admin')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'Rol super_admin asignado a profile_id=%', v_profile_id;
END;
$$;
