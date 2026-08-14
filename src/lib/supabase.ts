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
          signInWithPassword: async () => { throw new Error('Error: Conexión a Supabase no configurada. Faltan las variables de entorno en Vercel.'); },
          signUp: async () => { throw new Error('Error: Conexión a Supabase no configurada. Faltan las variables de entorno en Vercel.'); },
        };
      }
      return () => {
        throw new Error('Supabase no está configurado. Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
      };
    }
  });
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
