import { supabase } from '../lib/supabase';
import { AuditLog } from '../types';

export const activityService = {
  /**
   * Registra un evento de actividad/auditoría.
   */
  async log(
    userId: string | null,
    action: string,
    module: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        action,
        module,
        description,
        metadata: metadata || {},
      }]);

    if (error) {
      console.error('Error al registrar log de auditoría:', error);
    }
  },

  /**
   * Obtiene la bitácora completa de actividades.
   */
  async list(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, profiles(first_name, last_name, email, client_id, clients(name))')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((log: any) => {
      const p = log.profiles || {};
      const fullName = p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : 'Sistema';
      return {
        id: log.id,
        timestamp: log.created_at || new Date().toISOString(),
        userId: log.user_id || '',
        userName: fullName,
        userEmail: p.email || 'sistema@campana.ai',
        clientId: p.client_id || '',
        clientName: p.clients?.name || '',
        action: log.action,
        module: log.module || 'General',
        category: (log.metadata?.category || 'Sistema') as AuditLog['category'],
        details: log.description || '',
        ipAddress: log.metadata?.ip || 'Offline',
        userAgent: log.metadata?.userAgent || '',
        result: (log.metadata?.result || 'Éxito') as AuditLog['result'],
      };
    });
  }
};
