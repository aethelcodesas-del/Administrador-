# BeeCampaign AI — Panel Central de Administración

Este repositorio contiene la aplicación de **Panel Central de Administración de BeeCampaign AI** completamente integrada de manera nativa con **Supabase** y **PostgreSQL**.

---

## ⚡ Requisitos y Configuración de Supabase

### 1. Variables de Entorno
Crea un archivo local `.env.local` en la raíz del proyecto para definir las claves de tu proyecto de Supabase (nunca utilices la clave `service_role` en el frontend):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-publicacion
```

Consulta [.env.example](.env.example) para ver la estructura base.

### 2. Estructura y Migraciones de Base de Datos
Las migraciones SQL están organizadas cronológicamente en la carpeta [supabase/migrations/](supabase/migrations/). Para inicializar tu base de datos de Supabase, puedes ejecutar estas migraciones desde la terminal utilizando el CLI de Supabase o copiar y pegar el contenido de los archivos directamente en el **SQL Editor** del panel de control de Supabase:

1. **[`001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)**: Crea las tablas de la base de datos (`profiles`, `roles`, `permissions`, `clients`, `software`, `modules`, `licenses`, `subscriptions`, `campaigns`, `invoices`, `activity_logs`, `settings`) junto con restricciones de integridad y llaves foráneas. Incluye el disparador (`trigger`) PostgreSQL que sincroniza automáticamente los nuevos registros de `auth.users` hacia la tabla pública `profiles`.
2. **[`002_rls_policies.sql`](supabase/migrations/002_rls_policies.sql)**: Activa Row Level Security (RLS) en todas las tablas sensibles del sistema y define las políticas de control de acceso basadas en roles (RBAC) y aislamiento de inquilinos (Tenants/Clients).
3. **[`003_seed_data.sql`](supabase/migrations/003_seed_data.sql)**: Inserta los roles por defecto (`super_admin`, `admin`, `supervisor`, `user`), privilegios de seguridad base, el registro del software central y todos sus módulos (campaña, territorio, electores, líderes, etc.).
4. **[`004_rpc_helpers.sql`](supabase/migrations/004_rpc_helpers.sql)**: Implementa la función de base de datos segura `create_client_auth_user` para que el administrador central pueda dar de alta a nuevos usuarios desde la interfaz web sin interferir con las redirecciones de sesión cliente.

---

## 🔑 Creación del Primer Super Admin General

Para registrar y dar de alta tu primera cuenta de acceso administrativo principal (`super_admin`), sigue estos pasos:

1. Levanta la aplicación localmente (`npm run dev`) y ve a la página de inicio.
2. Haz clic en **Ingresar al Panel** o regístrate directamente desde el formulario de registro de la landing page con un correo (ej. `admin@campana.ai`). Esto creará el usuario de manera segura en Supabase Auth y su respectiva fila en `profiles`.
3. Para asignarle el rol de **Super Administrador**, abre el **SQL Editor** en el panel web de tu proyecto de Supabase y ejecuta la siguiente consulta:

```sql
-- 1. Buscar el id del perfil del usuario registrado
SELECT id, email FROM public.profiles WHERE email = 'admin@campana.ai';

-- 2. Asignar el rol de super_admin en la tabla user_roles
-- (Reemplaza 'PROFILE_UUID' por el ID retornado en el paso anterior)
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('PROFILE_UUID', 'super_admin')
ON CONFLICT (user_id, role_id) 
DO UPDATE SET role_id = 'super_admin';
```

---

## 🛠️ Ejecución y Empaquetado Local

### Instalación de dependencias
```bash
npm install
```

### Ejecutar servidor de desarrollo local
```bash
npm run dev
```

### Compilación estática de producción (Vite build)
```bash
npm run build
```

El bundle de distribución estática listo para producción se guardará en la carpeta `dist/`.
