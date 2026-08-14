import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  /**
   * Inicia sesión con correo y contraseña.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No se pudo iniciar sesión. Usuario no encontrado.');

    // Cargar perfil completo con su rol
    const profile = await this.getProfileByAuthId(data.user.id);
    return { session: data.session, user: data.user, profile };
  },

  /**
   * Cierra la sesión activa del usuario.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Registra un nuevo usuario en la base de datos.
   */
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    clientId?: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No se pudo crear la cuenta de usuario.');

    // Esperar unos milisegundos para que el trigger asincrónico inserte el perfil
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Actualizar campos específicos (teléfono, cliente) que no se configuran por defecto
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: phone || null,
        client_id: clientId || null,
      })
      .eq('auth_user_id', data.user.id);

    if (profileError) {
      console.warn('Advertencia al actualizar campos de perfil adicionales:', profileError);
    }

    const profile = await this.getProfileByAuthId(data.user.id);
    return { user: data.user, profile };
  },

  /**
   * Obtiene la sesión activa actual del usuario.
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Obtiene la información de perfil asociada al usuario autenticado.
   */
  async getCurrentUser() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const profile = await this.getProfileByAuthId(user.id);
    return profile;
  },

  /**
   * Recupera el perfil del usuario buscando por su auth_user_id.
   */
  async getProfileByAuthId(authUserId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role_id), clients(name)')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Mapear al modelo de la aplicación
    const roleId = data.user_roles?.[0]?.role_id || 'user';

    // Obtener los nombres correctos de roles para la interfaz
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
      roleId: roleId,
      roleName: roleName,
      status: data.status || 'Activo',
      avatarUrl: data.avatar_url || '',
      createdAt: data.created_at,
    };
  },

  /**
   * Solicita el restablecimiento de contraseña para un correo electrónico.
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Actualiza la contraseña del usuario logueado.
   */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }
};
