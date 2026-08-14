-- 003_seed_data.sql
-- Seed Initial Lookup Data for BEE CAMPAIGN AI Central Admin Panel

-- 1. Insert Core Roles
INSERT INTO public.roles (id, name, description, status) VALUES
('super_admin', 'Super Administrador General', 'Acceso total sin restricciones a todos los clientes, licencias y configuraciones del panel.', 'Activo'),
('admin', 'Administrador de Campaña', 'Acceso para gestionar los usuarios y módulos dentro de su campaña/organización.', 'Activo'),
('supervisor', 'Supervisor del Panel', 'Acceso para monitorear y dar soporte a clientes, sin poder de alteración crítica.', 'Activo'),
('user', 'Usuario de Consulta', 'Acceso básico de lectura a los módulos de su campaña autorizados.', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Permissions
INSERT INTO public.permissions (id, name, description, module, action) VALUES
('users.view', 'Ver Usuarios', 'Permite visualizar el listado de usuarios de la organización.', 'usuarios', 'view'),
('users.create', 'Crear Usuarios', 'Permite dar de alta nuevos usuarios.', 'usuarios', 'create'),
('users.edit', 'Editar Usuarios', 'Permite modificar detalles de usuarios existentes.', 'usuarios', 'edit'),
('users.delete', 'Eliminar Usuarios', 'Permite dar de baja o suspender usuarios.', 'usuarios', 'delete'),
('licenses.view', 'Ver Licencias', 'Permite visualizar las licencias del cliente.', 'licencias', 'view'),
('licenses.create', 'Crear Licencias', 'Permite dar de alta nuevas licencias.', 'licencias', 'create'),
('licenses.edit', 'Editar Licencias', 'Permite suspender o modificar parámetros de licencias.', 'licencias', 'edit'),
('subscriptions.view', 'Ver Suscripciones', 'Permite visualizar detalles de planes y facturación.', 'suscripciones', 'view'),
('modules.view', 'Ver Módulos', 'Permite visualizar módulos activos.', 'modulos', 'view'),
('settings.view', 'Ver Configuración', 'Permite ver los parámetros del sistema.', 'settings', 'view'),
('settings.manage', 'Gestionar Configuración', 'Permite editar configuraciones globales.', 'settings', 'manage')
ON CONFLICT (id) DO NOTHING;

-- 3. Associate Role Permissions (super_admin has everything, admin has most, user has basic view)
-- Assign all to super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM public.permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to admin
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('admin', 'users.view'),
('admin', 'users.create'),
('admin', 'users.edit'),
('admin', 'users.delete'),
('admin', 'licenses.view'),
('admin', 'subscriptions.view'),
('admin', 'modules.view'),
('admin', 'settings.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to supervisor
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('supervisor', 'users.view'),
('supervisor', 'licenses.view'),
('supervisor', 'subscriptions.view'),
('supervisor', 'modules.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to user
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('user', 'modules.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Register Software product
INSERT INTO public.software (id, name, slug, description, version, status) VALUES
('software-beecampaign', 'BeeCampaign AI', 'beecampaign-ai', 'Software inteligente para gestión integral de campañas políticas, electores y estrategia territorial.', '1.0.0', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 5. Register Software Modules
INSERT INTO public.modules (id, software_id, name, slug, description, icon, status) VALUES
('dashboard', 'software-beecampaign', 'Dashboard General', 'dashboard', 'Resumen y métricas clave de la campaña.', 'LayoutDashboard', 'Activo'),
('campana', 'software-beecampaign', 'Ficha de Campaña', 'campana', 'Configuración de metas, candidatos y cronograma.', 'Award', 'Activo'),
('territorio', 'software-beecampaign', 'Estructura Territorial', 'territorio', 'Organización de zonas, puestos de votación y metas físicas.', 'MapPin', 'Activo'),
('electores', 'software-beecampaign', 'Censo Electoral', 'electores', 'Bases de datos de votantes y control de intención de voto.', 'Users', 'Activo'),
('lideres', 'software-beecampaign', 'Red de Líderes', 'lideres', 'Control y asignación de líderes y metas de referidos.', 'UserCheck', 'Activo'),
('investigacion', 'software-beecampaign', 'Investigación & Encuestas', 'investigacion', 'Resultados de encuestas, focus group y estudios de opinión.', 'Search', 'Activo'),
('estrategia', 'software-beecampaign', 'Estrategia Político-Digital', 'estrategia', 'Líneas discursivas, segmentación y plan estratégico.', 'Compass', 'Activo'),
('finanzas', 'software-beecampaign', 'Control de Gastos (Ingresos/Egresos)', 'finanzas', 'Presupuestos, topes legales y flujo de caja.', 'DollarSign', 'Activo'),
('comunicaciones', 'software-beecampaign', 'Comunicaciones (Prensa/Redes)', 'comunicaciones', 'Monitoreo de medios y comunicados oficiales.', 'Radio', 'Activo'),
('operacion', 'software-beecampaign', 'Operación Día E', 'operacion', 'Logística electoral, testigos de mesa y reportes en tiempo real.', 'Clock', 'Activo'),
('documentos', 'software-beecampaign', 'Biblioteca de Documentos', 'documentos', 'Archivos, leyes, decretos y materiales de campaña.', 'Folder', 'Activo'),
('ia', 'software-beecampaign', 'Inteligencia Artificial (Predicción/Asistente)', 'ia', 'Análisis predictivo de votos y asistente de discursos.', 'Sparkles', 'Activo'),
('reportes', 'software-beecampaign', 'Reportes y PDF', 'reportes', 'Generación de informes de avance.', 'FileText', 'Activo'),
('soporte', 'software-beecampaign', 'Centro de Soporte', 'soporte', 'Canales de soporte técnico.', 'HelpCircle', 'Activo'),
('bitacora', 'software-beecampaign', 'Bitácora & Auditoría', 'bitacora', 'Historial detallado de accesos y modificaciones.', 'History', 'Activo'),
('simulador', 'software-beecampaign', 'Simulador Electoral', 'simulador', 'Modelador matemático de escenarios de votación.', 'Calculator', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 6. Register Subscription Plans
INSERT INTO public.subscription_plans (id, name, slug, description, price, duration_days, status) VALUES
('plan-free', 'Free', 'free', 'Acceso básico a mensajería y funciones esenciales.', 0.00, 365, 'Activo'),
('plan-plus', 'Plus', 'plus', 'Ideal para equipos pequeños que necesitan más capacidad.', 9900.00, 30, 'Activo'),
('plan-pro', 'Pro', 'pro', 'Para empresas en crecimiento con necesidades avanzadas.', 24900.00, 30, 'Activo'),
('plan-enterprise', 'Enterprise', 'enterprise', 'Solución completa con soporte dedicado y almacenamiento ampliado.', 59900.00, 30, 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 7. Initialize default system parameters
INSERT INTO public.settings (key, value, description) VALUES
('enforce_mfa', 'false', 'Obligar a todos los usuarios superadmin a activar doble factor de autenticación.'),
('allowed_countries', '["Colombia", "México", "Perú", "Ecuador"]', 'Países permitidos para creación de clientes en el panel.'),
('maintenance_mode', 'false', 'Colocar el panel central de administración en modo de mantenimiento.')
ON CONFLICT (key) DO NOTHING;
