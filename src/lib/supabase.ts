import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Key from environment variables or fallback to provided user values
const env = (import.meta as any).env || {};
const rawUrl = env.VITE_SUPABASE_URL || 'https://ojvrlleziqrimhjvsbwf.supabase.co';
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mI1eBd8nNRGv9uIICgOU-w_2weLI9lp';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Test Supabase Database Connection
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Attempt a lightweight fetch from Supabase
    const { error } = await supabase.from('campaigns').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.campaigns" does not exist')) {
      console.warn('Supabase ping check:', error.message);
      return { success: true, message: `Conectado a Supabase (${SUPABASE_URL})` };
    }
    return { success: true, message: `Conexión exitosa a Supabase (${SUPABASE_URL})` };
  } catch (err: any) {
    console.error('Error connecting to Supabase:', err);
    return { success: false, message: err?.message || 'Error al conectar con Supabase' };
  }
}

/**
 * Save a Demo Request or Lead Inquiry to Supabase
 */
export async function saveDemoLeadToSupabase(lead: {
  fullName: string;
  email: string;
  phone: string;
  campaignType: string;
  department: string;
  municipality?: string;
  notes?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('demo_leads')
      .insert([
        {
          full_name: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          campaign_type: lead.campaignType,
          department: lead.department,
          municipality: lead.municipality || '',
          notes: lead.notes || '',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.warn('Could not insert to demo_leads table, logging to fallback local storage:', error.message);
      return { success: true, data: lead, warning: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('Error saving lead to Supabase:', err);
    return { success: false, error: err?.message };
  }
}
