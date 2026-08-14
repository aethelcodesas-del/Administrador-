import { supabase } from '../lib/supabase';
import { User } from '../types';

export const userService = {
  /**
   * Obtiene la lista completa de perfiles de usuario.
   */
  async list(clientId?: string): Promise<User[]> {
    let query = supabase
      .from('profiles')
      .select('*, user_roles(role_id), clients(name), campaigns(name)');

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((p: any) => {
      const roleId = p.user_roles?.[0]?.role_id || 'user';
      let roleName = 'Usuario de Consulta';
      if (roleId === 'super_admin') roleName = 'Super Administrador General';
      if (roleId === 'admin') roleName = 'Administrador de Campaña';
      if (roleId === 'supervisor') roleName = 'Supervisor del Panel';

      return {
        id: p.id,
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        email: p.email,
        phone: p.phone || '',
        clientId: p.client_id || '',
        clientName: p.clients?.name || '',
        campaignId: p.campaign_id || '',
        campaignName: p.campaigns?.name || '',
        roleId: roleId,
        roleName: roleName,
        status: p.status || 'Activo',
        lastAccessAt: 'Pendiente',
        createdAt: p.created_at ? p.created_at.split('T')[0] : '',
        ipAddress: 'Offline',
      };
    });
  },

  /**
   * Obtiene la información de un usuario por su ID.
   */
  async get(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role_id), clients(name), campaigns(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const roleId = data.user_roles?.[0]?.role_id || 'user';
    let roleName = 'Usuario de Consulta';
    if (roleId === 'super_admin') roleName = 'Super Administrador General';
    if (roleId === 'admin') roleName = 'Administrador de Campaña';
    if (roleId === 'supervisor') roleName = 'Supervisor del Panel';

    return {
      id: data.id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email,
      phone: data.phone || '',
      clientId: data.client_id || '',
      clientName: data.clients?.name || '',
      campaignId: data.campaign_id || '',
      campaignName: data.campaigns?.name || '',
      roleId: roleId,
      roleName: roleName,
      status: data.status || 'Activo',
      lastAccessAt: 'Aún no ingresa',
      createdAt: data.created_at ? data.created_at.split('T')[0] : '',
      ipAddress: 'Pendiente',
    };
  },

  /**
   * Crea un nuevo registro de usuario en el sistema.
   * Nota: Este método inserta los datos de perfil. Para crear la credencial de autenticación
   * se debe utilizar authService.signUp()
   */
  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email.trim().toLowerCase(),
        phone: user.phone,
        client_id: user.clientId || null,
        campaign_id: user.campaignId || null,
        status: user.status || 'Activo',
      }])
      .select()
      .single();

    if (error) throw error;

    // Asignar el rol al usuario
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: data.id,
        role_id: user.roleId || 'user',
      }]);

    if (roleError) {
      console.error('Error al asignar el rol del usuario:', roleError);
    }

    return {
      ...user,
      id: data.id,
      createdAt: data.created_at ? data.created_at.split('T')[0] : '',
    };
  },

  /**
   * Modifica un perfil de usuario existente.
   */
  async update(id: string, user: Partial<User>): Promise<void> {
    const updateData: any = {};
    if (user.firstName !== undefined) updateData.first_name = user.firstName;
    if (user.lastName !== undefined) updateData.last_name = user.lastName;
    if (user.phone !== undefined) updateData.phone = user.phone;
    if (user.status !== undefined) updateData.status = user.status;
    if (user.clientId !== undefined) updateData.client_id = user.clientId || null;
    if (user.campaignId !== undefined) updateData.campaign_id = user.campaignId || null;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    }

    // Actualizar rol si fue especificado
    if (user.roleId !== undefined) {
      // Eliminar roles previos
      await supabase.from('user_roles').delete().eq('user_id', id);
      // Insertar nuevo rol
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: id, role_id: user.roleId }]);
      if (roleError) throw roleError;
    }
  },

  /**
   * Da de baja a un usuario.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'Suspendido' })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Asigna permisos de módulos a un usuario.
   */
  async assignModules(userId: string, moduleIds: string[]): Promise<void> {
    // 1. Eliminar módulos previos asignados individualmente
    const { error: deleteError } = await supabase
      .from('user_modules')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // 2. Insertar los nuevos módulos asignados
    if (moduleIds.length > 0) {
      const inserts = moduleIds.map((modId) => ({
        user_id: userId,
        module_id: modId,
        status: 'Activo',
      }));

      const { error: insertError } = await supabase
        .from('user_modules')
        .insert(inserts);

      if (insertError) throw insertError;
    }
  },

  /**
   * Obtiene los IDs de módulos asignados individualmente al usuario.
   */
  async getAssignedModules(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_modules')
      .select('module_id')
      .eq('user_id', userId)
      .eq('status', 'Activo');

    if (error) throw error;
    return (data || []).map((m: any) => m.module_id);
  }
};
