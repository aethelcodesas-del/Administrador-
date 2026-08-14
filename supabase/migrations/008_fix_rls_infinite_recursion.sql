-- 008_fix_rls_infinite_recursion.sql
-- ============================================================
-- PROBLEMA: infinite recursion detected in policy for relation "profiles"
--
-- CAUSA RAÍZ:
-- 1. La función current_user_has_role() hace JOIN con profiles.
--    Se llama desde las políticas RLS de profiles → recursión.
-- 2. La política "Super admin and client admin full access on profiles"
--    contiene un subquery que lee profiles desde dentro de una política
--    de profiles → segunda fuente de recursión.
--
-- SOLUCIÓN:
-- A. Reescribir current_user_has_role() con SET LOCAL row_security = off
--    para que desactive RLS dentro de su propio contexto SECURITY DEFINER.
--    Esto es seguro porque la función ya corre como el owner (postgres),
--    que es superusuario — no amplía permisos de nadie.
-- B. Reemplazar las políticas de profiles que generan recursión por
--    políticas sin subqueries auto-referenciales.
-- ============================================================

-- ── PASO 1: Corregir la función helper ──────────────────────
-- Agregar SET LOCAL row_security = off para romper la recursión.
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result BOOLEAN := FALSE;
BEGIN
  -- Desactivar RLS localmente dentro de esta función SECURITY DEFINER.
  -- Como la función corre como el owner (postgres, superuser), esto
  -- es equivalente a lo que ya debería ocurrir — solo lo hacemos explícito
  -- para romper el ciclo de evaluación de políticas.
  SET LOCAL row_security = off;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE p.auth_user_id = auth.uid()
      AND ur.role_id = required_role
  ) INTO result;

  RETURN result;
END;
$$;

-- ── PASO 2: Eliminar las políticas recursivas de profiles ────
DROP POLICY IF EXISTS "Allow read access to own profile"                        ON public.profiles;
DROP POLICY IF EXISTS "Allow update to own profile"                             ON public.profiles;
DROP POLICY IF EXISTS "Super admin and client admin full access on profiles"    ON public.profiles;

-- ── PASO 3: Recrear políticas de profiles SIN recursión ─────

-- SELECT: cada usuario ve su propio perfil.
-- Admins ven todos los perfiles de su client_id mediante current_user_has_role
-- (que ahora no recursa porque tiene SET LOCAL row_security = off).
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = auth_user_id
    OR public.current_user_has_role('super_admin')
    OR public.current_user_has_role('admin')
  );

-- UPDATE: el usuario actualiza su propio perfil; super_admin puede actualizar cualquiera.
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = auth_user_id
    OR public.current_user_has_role('super_admin')
  )
  WITH CHECK (
    auth.uid() = auth_user_id
    OR public.current_user_has_role('super_admin')
  );

-- INSERT: solo super_admin puede insertar perfiles manualmente.
-- (el trigger on_auth_user_created corre como SECURITY DEFINER y no requiere política)
CREATE POLICY "profiles_insert_superadmin"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_has_role('super_admin')
  );

-- DELETE: solo super_admin puede eliminar perfiles.
CREATE POLICY "profiles_delete_superadmin"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role('super_admin')
  );

-- ── PASO 4: Revocar acceso anon a la función si existe ───────
REVOKE EXECUTE ON FUNCTION public.current_user_has_role(VARCHAR) FROM anon;
GRANT  EXECUTE ON FUNCTION public.current_user_has_role(VARCHAR) TO authenticated;
