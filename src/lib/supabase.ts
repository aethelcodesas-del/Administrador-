import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están definidas.');
  // Proxy seguro para evitar que el bundle de React falle al inicio por importación directa
  supabaseClient = new Proxy({}, {
    get(target, prop) {
      if (prop === 'auth') {
        return {
          getUser: async () => ({ data: { user: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signOut: async () => ({ error: null }),
        };
      }
      return () => {
        throw new Error('Supabase no configurado. Asegúrate de definir VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.');
      };
    }
  });
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
