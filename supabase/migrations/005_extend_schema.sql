-- 005_extend_schema.sql
-- Ampliar las tablas existentes con las columnas que requiere la aplicación

-- ============================================================
-- 1. TABLA: clients — agregar campos necesarios para el panel
-- ============================================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS organization_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS responsible_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Colombia',
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS active_users_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_users_allowed INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS active_campaigns_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS aspiration VARCHAR(100);

-- Backfill: usar 'name' como organization_name donde no esté definido
UPDATE public.clients SET organization_name = name WHERE organization_name IS NULL;

-- ============================================================
-- 2. TABLA: licenses — agregar campos necesarios
-- ============================================================
ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS license_type VARCHAR(50) DEFAULT 'Anual',
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS used_users INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_campaigns INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_campaigns INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS enabled_module_codes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 3. TABLA: subscriptions — agregar campos necesarios
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'COP',
  ADD COLUMN IF NOT EXISTS periodicity VARCHAR(50) DEFAULT 'Mensual',
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- ============================================================
-- 4. TABLA: campaigns — agregar campos necesarios
-- ============================================================
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS candidate_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS election_type VARCHAR(100) DEFAULT 'Alcaldía',
  ADD COLUMN IF NOT EXISTS territory VARCHAR(200),
  ADD COLUMN IF NOT EXISTS election_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS budget NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spent NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS registered_voters_target INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registered_voters_current INTEGER DEFAULT 0;

-- ============================================================
-- 5. TABLA: invoices — agregar campos necesarios
-- ============================================================
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ============================================================
-- 6. TABLA: activity_logs — agregar campos para auditoría  
-- ============================================================
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS user_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS user_email VARCHAR(200),
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Sistema',
  ADD COLUMN IF NOT EXISTS details TEXT,
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50),
  ADD COLUMN IF NOT EXISTS result VARCHAR(50) DEFAULT 'Éxito',
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 7. RPC: función para obtener estadísticas del dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clients',        (SELECT COUNT(*) FROM public.clients),
    'active_clients',       (SELECT COUNT(*) FROM public.clients WHERE status = 'Activo'),
    'total_users',          (SELECT COUNT(*) FROM public.profiles),
    'active_licenses',      (SELECT COUNT(*) FROM public.licenses WHERE status = 'Activa'),
    'expiring_licenses',    (SELECT COUNT(*) FROM public.licenses WHERE status = 'Activa' AND expiration_date <= NOW() + INTERVAL '30 days'),
    'active_campaigns',     (SELECT COUNT(*) FROM public.campaigns WHERE status = 'En Ejecución'),
    'total_revenue',        (SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices WHERE status = 'Pagada'),
    'pending_invoices',     (SELECT COUNT(*) FROM public.invoices WHERE status = 'Pendiente')
  ) INTO result;
  RETURN result;
END;
$$;
