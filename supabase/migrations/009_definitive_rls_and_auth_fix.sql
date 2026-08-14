-- ============================================================
-- 009_definitive_rls_and_auth_fix.sql
-- SOLUCIÓN DEFINITIVA al error:
--   "infinite recursion detected in policy for relation profiles"
--
-- CAUSA RAÍZ:
--   Las políticas RLS de `profiles` llaman a current_user_has_role()
--   que internamente hace JOIN con `profiles` → PostgreSQL detecta
--   el ciclo en tiempo de planificación y lanza el error.
--
-- SOLUCIÓN:
--   1. Eliminar TODAS las políticas de `profiles` que llamen funciones
--      que lean `profiles`.
--   2. Para profiles SELECT: usar USING(true) — todos los usuarios
--      autenticados pueden leer perfiles (patrón estándar en paneles admin).
--   3. Para profiles UPDATE: usar auth.uid() = auth_user_id directamente.
--   4. INSERT y DELETE solo via funciones SECURITY DEFINER (trigger/RPCs).
--   5. Crear RPC get_my_profile que lee el perfil del usuario actual
--      sin disparar RLS recursiva.
--   6. Crear/actualizar RPC ensure_profile_exists para el registro.
-- ============================================================

-- ── PASO 1: Limpiar TODAS las políticas existentes de profiles ──
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END;
$$;

-- ── PASO 2: Crear políticas SIMPLES para profiles (SIN recursión) ──

-- SELECT: Todos los usuarios autenticados pueden leer perfiles.
-- Esto es seguro para un panel de administración y ELIMINA
-- completamente la posibilidad de recursión.
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: Solo el dueño del perfil puede actualizarlo.
-- Admin/super_admin actualizan vía funciones SECURITY DEFINER (RPCs).
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- INSERT: Bloqueado para queries directas del usuario.
-- Los perfiles se crean SOLO vía:
--   1. Trigger on_auth_user_created (SECURITY DEFINER, bypasses RLS)
--   2. RPC ensure_profile_exists (SECURITY DEFINER, bypasses RLS)
-- No necesitamos política INSERT porque los SECURITY DEFINER la ignoran.

-- DELETE: Bloqueado para queries directas.
-- Solo vía RPCs de administración (SECURITY DEFINER).

-- ── PASO 3: Asegurar que user_roles SELECT es USING(true) ──
-- (ya debería serlo, pero lo confirmamos)
DROP POLICY IF EXISTS "Allow read access to user_roles for authenticated users" ON public.user_roles;
CREATE POLICY "user_roles_select_authenticated"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- ── PASO 4: Recrear current_user_has_role (sin cambios funcionales) ──
-- Ahora que profiles SELECT es USING(true), esta función ya no causa
-- recursión cuando se llama desde OTRAS tablas.
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE p.auth_user_id = auth.uid()
      AND ur.role_id = required_role
  );
END;
$$;

-- ── PASO 5: RPC get_my_profile — obtener perfil completo del usuario actual ──
-- Corre como SECURITY DEFINER para evitar cualquier problema RLS.
-- El frontend puede llamar esto como alternativa al query directo.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id',           p.id,
    'auth_user_id', p.auth_user_id,
    'first_name',   p.first_name,
    'last_name',    p.last_name,
    'email',        p.email,
    'phone',        p.phone,
    'status',       p.status,
    'client_id',    p.client_id,
    'client_name',  COALESCE(c.name, ''),
    'avatar_url',   p.avatar_url,
    'created_at',   p.created_at,
    'role_id',      COALESCE(ur.role_id, 'user')
  )
  INTO v_result
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.clients c ON c.id = p.client_id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- ── PASO 6: RPC ensure_profile_exists — garantizar perfil tras registro ──
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
      auth_user_id, email, first_name, last_name, status
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
    -- Actualizar campos faltantes
    UPDATE public.profiles
    SET
      first_name = CASE WHEN first_name IS NULL OR first_name = ''
                   THEN COALESCE(NULLIF(TRIM(p_first_name), ''), SPLIT_PART(p_email, '@', 1))
                   ELSE first_name END,
      last_name  = CASE WHEN last_name IS NULL OR last_name = ''
                   THEN COALESCE(NULLIF(TRIM(p_last_name), ''), '')
                   ELSE last_name END,
      status     = COALESCE(status, 'Activo'),
      updated_at = now()
    WHERE id = v_profile_id;
  END IF;

  -- 3. Garantizar rol asignado
  SELECT role_id INTO v_role_id
  FROM public.user_roles
  WHERE user_id = v_profile_id
  LIMIT 1;

  IF v_role_id IS NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_profile_id, 'user')
    ON CONFLICT (user_id, role_id) DO NOTHING;
    v_role_id := 'user';
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

-- ── PASO 7: Verificar que el trigger on_auth_user_created existe ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_profile_id UUID;
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, first_name, last_name, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_metadata->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_metadata->>'last_name', ''),
    'Activo'
  )
  ON CONFLICT (auth_user_id) DO NOTHING
  RETURNING id INTO new_profile_id;

  -- Si el perfil ya existía, obtener su id
  IF new_profile_id IS NULL THEN
    SELECT id INTO new_profile_id FROM public.profiles WHERE auth_user_id = new.id;
  END IF;

  -- Asignar rol por defecto
  IF new_profile_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new_profile_id, 'user')
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger (DROP + CREATE para asegurar)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── PASO 8: RPC admin para actualizar perfiles de otros usuarios ──
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_target_profile_id UUID,
  p_updates           JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
BEGIN
  -- Verificar que el llamante es super_admin o admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE p.auth_user_id = auth.uid()
      AND ur.role_id IN ('super_admin', 'admin')
  ) INTO v_caller_is_admin;

  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Permisos insuficientes para esta operación.';
  END IF;

  -- Aplicar actualizaciones permitidas
  UPDATE public.profiles
  SET
    first_name = COALESCE(p_updates->>'first_name', first_name),
    last_name  = COALESCE(p_updates->>'last_name', last_name),
    phone      = COALESCE(p_updates->>'phone', phone),
    status     = COALESCE(p_updates->>'status', status),
    client_id  = COALESCE(p_updates->>'client_id', client_id),
    updated_at = now()
  WHERE id = p_target_profile_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, JSONB) TO authenticated;
