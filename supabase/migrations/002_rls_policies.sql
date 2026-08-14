-- 002_rls_policies.sql
-- Security configuration with Row Level Security (RLS) for BEE CAMPAIGN AI

-- 1. Helper function to check role of current authenticated user
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE p.auth_user_id = auth.uid()
    AND ur.role_id = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES FOR 'roles' AND 'permissions' (Read-only for all authenticated, write for super_admin)
CREATE POLICY "Allow read access to roles for authenticated users"
  ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on roles"
  ON public.roles FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

CREATE POLICY "Allow read access to permissions for authenticated users"
  ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on permissions"
  ON public.permissions FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

CREATE POLICY "Allow read access to role_permissions for authenticated users"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on role_permissions"
  ON public.role_permissions FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

CREATE POLICY "Allow read access to user_roles for authenticated users"
  ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on user_roles"
  ON public.user_roles FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

-- 4. POLICIES FOR 'profiles'
CREATE POLICY "Allow read access to own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR public.current_user_has_role('super_admin') OR public.current_user_has_role('admin'));
CREATE POLICY "Allow update to own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id OR public.current_user_has_role('super_admin'))
  WITH CHECK (auth.uid() = auth_user_id OR public.current_user_has_role('super_admin'));
CREATE POLICY "Super admin and client admin full access on profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.current_user_has_role('super_admin') OR (public.current_user_has_role('admin') AND client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid())));

-- 5. POLICIES FOR 'clients'
CREATE POLICY "Allow read client details to tenant users"
  ON public.clients FOR SELECT TO authenticated
  USING (id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.current_user_has_role('super_admin'));
CREATE POLICY "Super admin full access on clients"
  ON public.clients FOR ALL TO authenticated
  USING (public.current_user_has_role('super_admin'));

-- 6. POLICIES FOR 'software' AND 'modules'
CREATE POLICY "Allow read access to software for authenticated users"
  ON public.software FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on software"
  ON public.software FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

CREATE POLICY "Allow read access to modules for authenticated users"
  ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on modules"
  ON public.modules FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

-- 7. POLICIES FOR 'subscription_plans'
CREATE POLICY "Allow read access to subscription plans for all authenticated users"
  ON public.subscription_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on subscription plans"
  ON public.subscription_plans FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

-- 8. POLICIES FOR 'licenses' AND 'license_modules'
CREATE POLICY "Allow read licenses for tenant users"
  ON public.licenses FOR SELECT TO authenticated
  USING (client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.current_user_has_role('super_admin'));
CREATE POLICY "Super admin full access on licenses"
  ON public.licenses FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

CREATE POLICY "Allow read license modules for tenant users"
  ON public.license_modules FOR SELECT TO authenticated
  USING (
    license_id IN (SELECT id FROM public.licenses WHERE client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    OR public.current_user_has_role('super_admin')
  );
CREATE POLICY "Super admin full access on license modules"
  ON public.license_modules FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

-- 9. POLICIES FOR 'subscriptions'
CREATE POLICY "Allow read subscription for tenant users"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.current_user_has_role('super_admin'));
CREATE POLICY "Super admin full access on subscriptions"
  ON public.subscriptions FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

-- 10. POLICIES FOR 'user_modules'
CREATE POLICY "Allow users to read their own allocated modules"
  ON public.user_modules FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.current_user_has_role('super_admin') OR public.current_user_has_role('admin'));
CREATE POLICY "Super admin and client admin full access on user_modules"
  ON public.user_modules FOR ALL TO authenticated
  USING (
    public.current_user_has_role('super_admin') 
    OR (public.current_user_has_role('admin') AND user_id IN (SELECT id FROM public.profiles WHERE client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid())))
  );

-- 11. POLICIES FOR 'campaigns'
CREATE POLICY "Allow read campaigns for tenant users"
  ON public.campaigns FOR SELECT TO authenticated
  USING (client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.current_user_has_role('super_admin'));
CREATE POLICY "Client admin and Super admin write campaigns"
  ON public.campaigns FOR ALL TO authenticated
  USING (
    public.current_user_has_role('super_admin') 
    OR (public.current_user_has_role('admin') AND client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid()))
  );

-- 12. POLICIES FOR 'invoices'
CREATE POLICY "Allow read invoices for tenant users"
  ON public.invoices FOR SELECT TO authenticated
  USING (client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.current_user_has_role('super_admin'));
CREATE POLICY "Super admin full access on invoices"
  ON public.invoices FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));

-- 13. POLICIES FOR 'activity_logs'
CREATE POLICY "Allow read activity logs to tenant admins and super admin"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    public.current_user_has_role('super_admin')
    OR (public.current_user_has_role('admin') AND user_id IN (SELECT id FROM public.profiles WHERE client_id = (SELECT client_id FROM public.profiles WHERE auth_user_id = auth.uid())))
    OR user_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );
CREATE POLICY "Allow inserting activity logs for all authenticated users"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- 14. POLICIES FOR 'settings'
CREATE POLICY "Allow read access to settings for all authenticated users"
  ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin full access on settings"
  ON public.settings FOR ALL TO authenticated USING (public.current_user_has_role('super_admin'));
