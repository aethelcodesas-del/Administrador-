import { supabase } from '../lib/supabase';
import { License } from '../types';

export const licenseService = {
  /**
   * Obtiene la lista completa de licencias de clientes con sus módulos habilitados.
   */
  async list(clientId?: string): Promise<License[]> {
    let query = supabase
      .from('licenses')
      .select('*, clients(name), subscription_plans(name, max_users, max_campaigns, max_storage_gb), license_modules(module_id)');

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((l: any) => {
      const enabledModules = (l.license_modules || []).map((m: any) => m.module_id);
      const plan = l.subscription_plans || {};

      return {
        id: l.id,
        clientId: l.client_id,
        clientName: l.clients?.name || 'Cliente Desconocido',
        planId: l.plan_id || '',
        planName: plan.name || 'Plan Personalizado',
        createdAt: l.created_at ? l.created_at.split('T')[0] : '',
        activatedAt: l.start_date ? l.start_date.split('T')[0] : '',
        expiresAt: l.expiration_date ? l.expiration_date.split('T')[0] : '',
        status: l.status || 'Activa',
        licenseType: l.type || 'Mensual',
        maxUsers: plan.max_users || 5,
        usedUsers: 1, // Calculado en runtime
        maxCampaigns: plan.max_campaigns || 1,
        usedCampaigns: 1, // Calculado en runtime
        maxStorageGB: plan.max_storage_gb || 10,
        enabledModuleCodes: enabledModules,
        licenseKey: l.license_key || '',
        autoRenew: true,
      };
    });
  },

  /**
   * Crea una nueva licencia asociada a un cliente y activa sus módulos asociados.
   */
  async create(license: Omit<License, 'id' | 'createdAt'>, enabledModuleCodes: string[]): Promise<License> {
    const licenseId = (license as any).id || `LIC-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from('licenses')
      .insert([{
        id: licenseId,
        license_key: license.licenseKey || `CG-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        client_id: license.clientId,
        user_id: null, // Asignado a nivel de cliente admin
        software_id: 'software-beecampaign',
        plan_id: license.planId,
        type: license.licenseType || 'Mensual',
        status: license.status || 'Activa',
        start_date: license.activatedAt ? new Date(license.activatedAt).toISOString() : new Date().toISOString(),
        expiration_date: license.expiresAt ? new Date(license.expiresAt).toISOString() : new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Asignar los módulos asociados a la licencia en la tabla intermedia
    if (enabledModuleCodes.length > 0) {
      const inserts = enabledModuleCodes.map((modId) => ({
        license_id: licenseId,
        module_id: modId,
      }));

      const { error: modulesError } = await supabase
        .from('license_modules')
        .insert(inserts);

      if (modulesError) {
        console.error('Error al asociar módulos a la licencia:', modulesError);
      }
    }

    return {
      ...license,
      id: licenseId,
      createdAt: data.created_at ? data.created_at.split('T')[0] : '',
      enabledModuleCodes,
    };
  },

  /**
   * Modifica parámetros y módulos de una licencia.
   */
  async update(id: string, license: Partial<License>, enabledModuleCodes?: string[]): Promise<void> {
    const updateData: any = {};
    if (license.status !== undefined) updateData.status = license.status;
    if (license.licenseType !== undefined) updateData.type = license.licenseType;
    if (license.activatedAt !== undefined) updateData.start_date = new Date(license.activatedAt).toISOString();
    if (license.expiresAt !== undefined) updateData.expiration_date = new Date(license.expiresAt).toISOString();
    if (license.planId !== undefined) updateData.plan_id = license.planId;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('licenses')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    }

    // Actualizar los módulos habilitados si se suministra el array
    if (enabledModuleCodes !== undefined) {
      // Eliminar módulos previos
      await supabase.from('license_modules').delete().eq('license_id', id);

      // Insertar nuevos
      if (enabledModuleCodes.length > 0) {
        const inserts = enabledModuleCodes.map((modId) => ({
          license_id: id,
          module_id: modId,
        }));
        const { error: modulesError } = await supabase
          .from('license_modules')
          .insert(inserts);
        if (modulesError) throw modulesError;
      }
    }
  },

  /**
   * Renueva una licencia ampliando su fecha de vencimiento.
   */
  async renew(id: string, expirationDate: string): Promise<void> {
    const { error } = await supabase
      .from('licenses')
      .update({
        expiration_date: new Date(expirationDate).toISOString(),
        status: 'Activa',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Suspende una licencia de forma temporal.
   */
  async suspend(id: string): Promise<void> {
    const { error } = await supabase
      .from('licenses')
      .update({ status: 'Suspendida' })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Cancela una licencia permanentemente.
   */
  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('licenses')
      .update({ status: 'Vencida' })
      .eq('id', id);

    if (error) throw error;
  }
};
