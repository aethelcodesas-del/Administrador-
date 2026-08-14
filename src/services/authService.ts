import { supabase } from '../lib/supabase';
import { User } from '../types';

// Tiempo máximo de espera para que el trigger on_auth_user_created cree el perfil
const PROFILE_WAIT_MS = 600;
const PROFILE_RETRY_ATTEMPTS = 5;

export const authService = {
  /**
   * Inicia sesión con correo y contraseña.
   * Distingue claramente entre:
   *   - Error de Auth (credenciales incorrectas)
   *   - Error de perfil no encontrado
   *   - Usuario suspendido
   */
  async signIn(email: string, password: string) {
    // PASO 1: Autenticar en Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Error real de credenciales — no envolvemos con mensajes genéricos
      throw error;
    }
    if (!data.user) {
      throw new Error('No se pudo iniciar sesión. Usuario no encontrado.');
    }

    // PASO 2: Obtener perfil usando auth.uid() — NUNCA por email
    const profile = await this.getProfileByAuthId(data.user.id);

    if (!profile) {
      // El usuario existe en Auth pero no tiene perfil — situación anómala
      // Intentamos crearle el perfil usando la RPC de respaldo
      const recovered = await this.ensureProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.first_name || '',
        data.user.user_metadata?.last_name || ''
      );
      if (!recovered) {
        throw new Error(
          'El usuario existe pero su perfil no está configurado correctamente. Contacte al administrador.'
        );
      }
      const profileRetry = await this.getProfileByAuthId(data.user.id);
      return { session: data.session, user: data.user, profile: profileRetry };
    }

    // PASO 3: Verificar estado del perfil
    if (profile.status === 'Suspendido') {
      // Cerrar sesión inmediatamente — no permitir acceso
      await supabase.auth.signOut();
      throw new Error('El usuario está suspendido. Contacte al administrador.');
    }
    if (profile.status === 'Inactivo') {
      await supabase.auth.signOut();
      throw new Error('El usuario está inactivo. Contacte al administrador.');
    }

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
   * Garantiza que el perfil del usuario existe en la BD.
   * Llama a la RPC ensure_profile_exists que corre como SECURITY DEFINER.
   * Esto resuelve el problema de timing del trigger on_auth_user_created.
   */
  async ensureProfile(
    authUserId: string,
    email: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('ensure_profile_exists', {
        p_auth_user_id: authUserId,
        p_email:        email.trim().toLowerCase(),
        p_first_name:   firstName.trim(),
        p_last_name:    lastName.trim(),
      });
      if (error) {
        console.warn('[authService.ensureProfile] RPC error:', error);
        return false;
      }
      return data?.status === 'ok';
    } catch (e) {
      console.warn('[authService.ensureProfile] excepción:', e);
      return false;
    }
  },

  /**
   * Registra un nuevo usuario.
   * Garantiza que el perfil existe antes de devolver.
   */
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    clientId?: string
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    // PASO 1: Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          // Enviamos first_name y last_name para que el trigger los use correctamente
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No se pudo crear la cuenta de usuario.');

    const authUserId = data.user.id;

    // PASO 2: Esperar con reintentos a que el trigger cree el perfil
    // El trigger on_auth_user_created es asíncrono y puede tardar algunos ms
    let profile = null;
    for (let attempt = 1; attempt <= PROFILE_RETRY_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, PROFILE_WAIT_MS));
      profile = await this.getProfileByAuthId(authUserId).catch(() => null);
      if (profile) break;
      console.info(`[authService.signUp] Perfil no encontrado, reintento ${attempt}/${PROFILE_RETRY_ATTEMPTS}...`);
    }

    // PASO 3: Si el trigger no creó el perfil, usar RPC de respaldo
    if (!profile) {
      console.warn('[authService.signUp] Trigger no completó a tiempo. Usando RPC de respaldo...');
      await this.ensureProfile(authUserId, normalizedEmail, firstName, lastName);
      // Un último intento de lectura
      await new Promise((resolve) => setTimeout(resolve, 500));
      profile = await this.getProfileByAuthId(authUserId).catch(() => null);
    }

    if (!profile) {
      throw new Error(
        'El usuario fue creado en Auth pero no se pudo crear su perfil. Intente iniciar sesión manualmente.'
      );
    }

    // PASO 4: Actualizar campos adicionales (teléfono, cliente) si se proporcionaron
    if (phone || clientId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone:     phone     || null,
          client_id: clientId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', authUserId);

      if (updateError) {
        // No es crítico — el usuario ya está creado
        console.warn('[authService.signUp] No se pudieron actualizar campos adicionales:', updateError);
      }
    }

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
