// InsForge client bridge that delegates all operations directly to the real Supabase client.
// Allows seamless operation of existing queries against public schemas.

import { supabase } from '../lib/supabase';

export const insforge = {
  database: {
    from(table: string) {
      // Mapear nombres de colecciones del mock a nombres de tablas reales en PostgreSQL
      let pgTable = table;
      if (table === 'users' || table === 'users_list') {
        pgTable = 'profiles';
      } else if (table === 'plans') {
        pgTable = 'subscription_plans';
      } else if (table === 'audit' || table === 'audit_logs') {
        pgTable = 'activity_logs';
      }

      return supabase.from(pgTable);
    }
  },

  async rpc(fn: string, params?: any) {
    return supabase.rpc(fn, params);
  }
};

/**
 * Función puente de compatibilidad por si alguna vista requiere consultar colecciones locales directamente.
 */
export function getLocalCollection(collectionName: string): any[] {
  console.warn(`Se solicitó getLocalCollection para '${collectionName}'. Retornando array vacío por conexión a Supabase.`);
  return [];
}
