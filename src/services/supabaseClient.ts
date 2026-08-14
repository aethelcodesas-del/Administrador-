// Supabase client bridge mapping standard interfaces to the real Supabase library client.
import { supabase } from '../lib/supabase';

export { supabase } from '../lib/supabase';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const PANEL_ADMIN_URL = '#';

/**
 * Verifica la conexión real con Supabase consultando la tabla de settings.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('settings').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { success: true, message: 'Conexión a Supabase activa y validada exitosamente.' };
  } catch (e: any) {
    console.error('Error al probar conexión de Supabase:', e);
    return { success: false, message: `Error de conexión: ${e?.message || e}` };
  }
}

/**
 * Registra un cliente y su respectiva organización en Supabase Auth y PostgreSQL.
 */
export async function registerNewClient(data: {
  fullName: string;
  email: string;
  password: string;
  campaignName: string;
  phone?: string;
  department?: string;
}): Promise<{ success: boolean; error?: string; panelUrl?: string }> {
  try {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: data.password,
      options: {
        data: {
          first_name: data.fullName,
          last_name: '',
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear la cuenta de usuario en el servidor.');

    // Esperar a que el trigger inserte el perfil
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 2. Generar el ID de organización
    const clientId = `CLI-${Math.floor(100 + Math.random() * 900)}`;

    // 3. Crear el registro del cliente en public.clients
    const { error: clientError } = await supabase.from('clients').insert([{
      id: clientId,
      name: data.campaignName,
      document: 'N/A',
      email: cleanEmail,
      phone: data.phone || '',
      address: data.department || 'Colombia',
      status: 'Activo',
    }]);

    if (clientError) throw clientError;

    // 4. Actualizar el perfil del usuario vinculándolo al cliente
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: data.phone || null,
        client_id: clientId,
      })
      .eq('auth_user_id', authData.user.id);

    if (profileError) throw profileError;

    // 5. Vincular rol de administrador
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (profileData) {
      await supabase.from('user_roles').insert([{
        user_id: profileData.id,
        role_id: 'admin',
      }]);
    }

    // 6. Crear licencia Pro para el cliente por defecto
    const licenseId = `LIC-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresDate = new Date();
    expiresDate.setMonth(expiresDate.getMonth() + 12); // 12 meses de vigencia

    const { error: licError } = await supabase.from('licenses').insert([{
      id: licenseId,
      license_key: `CG-PRO-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      client_id: clientId,
      user_id: profileData?.id || null,
      software_id: 'software-beecampaign',
      plan_id: 'plan-pro',
      type: 'Anual',
      status: 'Activa',
      start_date: new Date().toISOString(),
      expiration_date: expiresDate.toISOString(),
    }]);

    if (licError) throw licError;

    // 7. Habilitar módulos por defecto
    const defaultModules = ['dashboard', 'campana', 'electores', 'lideres', 'comunicaciones', 'ia'];
    const modulesInserts = defaultModules.map((modId) => ({
      license_id: licenseId,
      module_id: modId,
    }));
    await supabase.from('license_modules').insert(modulesInserts);

    // 8. Crear suscripción anual por defecto
    const subId = `SUB-${Math.floor(10000 + Math.random() * 90000)}`;
    await supabase.from('subscriptions').insert([{
      id: subId,
      client_id: clientId,
      user_id: profileData?.id || null,
      plan_id: 'plan-pro',
      status: 'Activa',
      start_date: new Date().toISOString(),
      expiration_date: expiresDate.toISOString(),
    }]);

    // 9. Crear campaña por defecto
    await supabase.from('campaigns').insert([{
      id: `CAMP-${Math.floor(100 + Math.random() * 900)}`,
      client_id: clientId,
      name: data.campaignName,
      candidate_name: data.fullName,
      election_type: 'Alcaldía',
      territory: data.department || 'Colombia',
      start_date: new Date().toISOString(),
      election_date: expiresDate.toISOString(),
      status: 'En Ejecución',
    }]);

    return {
      success: true,
      panelUrl: '#',
    };
  } catch (err: any) {
    console.error('Error al registrar cliente en Supabase:', err);
    return { success: false, error: err?.message || 'Error al procesar el registro.' };
  }
}

/**
 * Guarda una consulta de demo directamente en la bitácora de actividad.
 */
export async function saveDemoLeadToSupabase(lead: {
  fullName: string;
  email: string;
  phone: string;
  campaignType: string;
  department: string;
  municipality?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const { data, error } = await supabase.from('activity_logs').insert([{
      action: 'demo_lead_request',
      module: 'landing',
      description: `Solicitud de Demo: ${lead.fullName} (${lead.email}) - Celular: ${lead.phone}`,
      metadata: lead,
    }]).select().single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('Error al guardar lead en Supabase:', err);
    return { success: false, error: err?.message || 'Error al enviar la solicitud.' };
  }
}
