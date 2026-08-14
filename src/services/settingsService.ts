import { supabase } from '../lib/supabase';

export const settingsService = {
  /**
   * Obtiene la configuración por su clave.
   */
  async get(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error(`Error al obtener configuración para clave ${key}:`, error);
      return null;
    }
    return data ? data.value : null;
  },

  /**
   * Actualiza el valor de una configuración.
   */
  async update(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from('settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;
  }
};
