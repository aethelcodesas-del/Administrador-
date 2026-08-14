-- 001_initial_schema.sql
-- Base Relational Schema for BEE CAMPAIGN AI Central Admin Panel

-- Triggers function to auto-create user profile on signup
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
  RETURNING id INTO new_profile_id;

  -- Default every new user to the basic 'user' role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new_profile_id, 'user');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Table (User Profile linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(30),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido', 'Pendiente')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger declaration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  module VARCHAR(50),
  action VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Role Permissions Bridge
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id VARCHAR(50) REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(100) REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- 5. User Roles Bridge
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id VARCHAR(50) REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- 6. Clients (Tenants) Table
CREATE TABLE IF NOT EXISTS public.clients (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  document VARCHAR(50),
  email VARCHAR(150),
  phone VARCHAR(50),
  address TEXT,
  status VARCHAR(50) DEFAULT 'Activo' CHECK (status IN ('Activo', 'Próximo a vencer', 'Vencido', 'Suspendido', 'Pendiente')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link profile to client (Many profiles to one client)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_id VARCHAR(50) REFERENCES public.clients(id) ON DELETE SET NULL;

-- 7. Software Table
CREATE TABLE IF NOT EXISTS public.software (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE,
  description TEXT,
  version VARCHAR(20),
  status VARCHAR(50) DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Modules Table
CREATE TABLE IF NOT EXISTS public.modules (
  id VARCHAR(50) PRIMARY KEY,
  software_id VARCHAR(50) REFERENCES public.software(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  price NUMERIC(12,2) DEFAULT 0,
  duration_days INT DEFAULT 365,
  status VARCHAR(50) DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Licenses Table
CREATE TABLE IF NOT EXISTS public.licenses (
  id VARCHAR(50) PRIMARY KEY,
  license_key VARCHAR(100) UNIQUE NOT NULL,
  client_id VARCHAR(50) REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  software_id VARCHAR(50) REFERENCES public.software(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Activa', 'Próxima a vencer', 'Vencida', 'Suspendida', 'active', 'pending', 'expired', 'suspended', 'cancelled')),
  start_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. License Modules Bridge
CREATE TABLE IF NOT EXISTS public.license_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id VARCHAR(50) REFERENCES public.licenses(id) ON DELETE CASCADE,
  module_id VARCHAR(50) REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(license_id, module_id)
);

-- 12. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id VARCHAR(50) PRIMARY KEY,
  client_id VARCHAR(50) REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_id VARCHAR(50) REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Activa' CHECK (status IN ('Activa', 'Pendiente', 'Cancelada', 'Suspendida', 'Prueba')),
  start_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. User Modules Bridge (Individual Modules allocation)
CREATE TABLE IF NOT EXISTS public.user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id VARCHAR(50) REFERENCES public.modules(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- 14. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id VARCHAR(50) PRIMARY KEY,
  client_id VARCHAR(50) REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  candidate_name VARCHAR(150),
  election_type VARCHAR(100),
  territory VARCHAR(100),
  start_date TIMESTAMPTZ,
  election_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'En Ejecución',
  registered_voters_target INT DEFAULT 50000,
  registered_voters_current INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link profile to active campaign (optional)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(50) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 15. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id VARCHAR(50) PRIMARY KEY,
  client_id VARCHAR(50) REFERENCES public.clients(id) ON DELETE CASCADE,
  subscription_id VARCHAR(50) REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  issue_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pagada', 'Pendiente', 'Vencida', 'Cancelada', 'Reembolsada')),
  description TEXT,
  payment_method VARCHAR(100),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Index Declarations
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_client ON public.licenses(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON public.subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
