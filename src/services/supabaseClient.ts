// Mock Supabase client that handles all authentication and database operations 100% locally in the browser.
// No external backend, no API keys, no secrets.

import { INITIAL_USERS, INITIAL_CLIENTS, INITIAL_LICENSES, INITIAL_SUBSCRIPTIONS, INITIAL_CAMPAIGNS } from '../data/initialData';

// Constants for URLs
export const SUPABASE_URL = 'http://localhost:3000';
export const PANEL_ADMIN_URL = '#';

// Helper to get local storage users list
const getLocalUsers = (): any[] => {
  const saved = localStorage.getItem('cg_users');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing cg_users:', e);
    }
  }
  // Initialize with initial seed users if empty
  localStorage.setItem('cg_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

// Seed credentials list
const SEED_CREDENTIALS = [
  { email: 'admin@campana.ai', password: 'demo', name: 'Santiago Pérez (Admin)', role: 'admin' },
  { email: 'admin@campana.ai', password: 'admin2026', name: 'Santiago Pérez (Admin)', role: 'admin' },
  { email: 'ober.osorio@campana.ai', password: 'password', name: 'Ober Osorio', role: 'admin' },
  { email: 'ober.osorio@campana.ai', password: 'demo', name: 'Ober Osorio', role: 'admin' },
  { email: 'santiago.perez@campana.ai', password: 'password', name: 'Santiago Pérez', role: 'admin' },
  { email: 'estrategia@campana.ai', password: 'estrategia2026', name: 'Dra. Elena Rostova', role: 'estrategico' },
  { email: 'territorio@campana.ai', password: 'territorio2026', name: 'Carlos Mendoza', role: 'territorial' }
];

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }: any) {
      console.log('🔑 Local Auth - signInWithPassword:', email);
      
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Check seed credentials first
      const seedMatch = SEED_CREDENTIALS.find(
        (c) => c.email.toLowerCase() === cleanEmail && c.password === cleanPassword
      );

      if (seedMatch) {
        const userObj = {
          id: `u-${seedMatch.role}-1`,
          email: seedMatch.email,
          user_metadata: { name: seedMatch.name },
          role: seedMatch.role
        };
        localStorage.setItem('cg_session', JSON.stringify(userObj));
        return { data: { user: userObj }, error: null };
      }

      // Check local storage users list
      const localUsers = getLocalUsers();
      const userMatch = localUsers.find(
        (u) => (u.email || '').toLowerCase().trim() === cleanEmail && (u.password === cleanPassword || u.passwordHash === cleanPassword)
      );

      if (userMatch) {
        const userObj = {
          id: userMatch.id,
          email: userMatch.email,
          user_metadata: { name: userMatch.name },
          role: userMatch.role_id || userMatch.role || 'admin'
        };
        localStorage.setItem('cg_session', JSON.stringify(userObj));
        return { data: { user: userObj }, error: null };
      }

      // Allow "demo" password fallback for easy testing
      if (cleanPassword === 'demo') {
        const userObj = {
          id: `u-demo-${Date.now()}`,
          email: cleanEmail,
          user_metadata: { name: cleanEmail.split('@')[0] },
          role: 'admin'
        };
        localStorage.setItem('cg_session', JSON.stringify(userObj));
        return { data: { user: userObj }, error: null };
      }

      return {
        data: { user: null },
        error: { message: 'Credenciales de demostración incorrectas. Usa admin@campana.ai / demo' }
      };
    },

    async signUp({ email, password, options }: any) {
      console.log('➕ Local Auth - signUp:', email);
      const cleanEmail = email.trim().toLowerCase();
      const localUsers = getLocalUsers();

      // Check if user already exists
      if (localUsers.some((u) => (u.email || '').toLowerCase().trim() === cleanEmail)) {
        return { data: null, error: { message: 'Este correo electrónico ya está registrado.' } };
      }

      const newUser = {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        email: cleanEmail,
        name: options?.data?.name || cleanEmail.split('@')[0],
        role_id: 'admin',
        role_name: 'Gestión Administrativa',
        status: 'Activo',
        created_at: new Date().toISOString(),
        password: password
      };

      const updatedUsers = [...localUsers, newUser];
      localStorage.setItem('cg_users', JSON.stringify(updatedUsers));

      const userObj = {
        id: newUser.id,
        email: newUser.email,
        user_metadata: { name: newUser.name },
        role: 'admin'
      };

      localStorage.setItem('cg_session', JSON.stringify(userObj));
      return { data: { user: userObj }, error: null };
    },

    async signOut() {
      console.log('🚪 Local Auth - signOut');
      localStorage.removeItem('cg_session');
      return { error: null };
    },

    async getUser() {
      const saved = localStorage.getItem('cg_session');
      if (saved) {
        try {
          return { data: { user: JSON.parse(saved) }, error: null };
        } catch (e) {
          return { data: { user: null }, error: e };
        }
      }
      return { data: { user: null }, error: null };
    },

    async signInWithOAuth({ provider }: any) {
      console.log('🌐 Local Auth - signInWithOAuth:', provider);
      // Simulate Google auth by logging in as seed admin user
      const userObj = {
        id: 'u-admin-1',
        email: 'admin@campana.ai',
        user_metadata: { name: 'Santiago Pérez (Admin)' },
        role: 'admin'
      };
      localStorage.setItem('cg_session', JSON.stringify(userObj));
      window.location.reload();
      return { error: null };
    }
  },

  // Dummy realtime channel implementation
  channel(name: string) {
    return {
      on(event: string, filter: any, callback: any) {
        return this;
      },
      subscribe() {
        return this;
      }
    };
  },

  removeChannel(channel: any) {
    // No-op
  }
};

/**
 * Test Database Connection Mock
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  return { success: true, message: 'Conexión local activa (Sin base de datos externa)' };
}

/**
 * Register a New Candidate/Client with instant Panel Admin access.
 * Simulates creation of client organization, superadmin user, and default license.
 */
export async function registerNewClient(data: {
  fullName: string;
  email: string;
  password: string;
  campaignName: string;
  phone?: string;
  department?: string;
}): Promise<{ success: boolean; error?: string; panelUrl?: string }> {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    
    // 1. Check if email exists
    const localUsers = getLocalUsers();
    if (localUsers.some((u) => (u.email || '').toLowerCase().trim() === cleanEmail)) {
      return { success: false, error: 'Este correo electrónico ya está registrado.' };
    }

    // 2. Create the client organization record
    const newClient = {
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      organizationName: data.campaignName,
      responsibleName: data.fullName,
      email: cleanEmail,
      phone: data.phone || '',
      country: 'Colombia',
      department: data.department || 'Colombia',
      city: 'Local',
      createdAt: new Date().toISOString(),
      status: 'Activo',
      planId: 'plan-pro'
    };

    const savedClients = JSON.parse(localStorage.getItem('cg_clients') || JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem('cg_clients', JSON.stringify([newClient, ...savedClients]));

    // 3. Create the superadmin user linked to the client
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      email: cleanEmail,
      name: data.fullName,
      role_id: 'admin',
      role_name: 'Gestión Administrativa',
      status: 'Activo',
      client_id: newClient.id,
      client_name: newClient.organizationName,
      created_at: new Date().toISOString(),
      password: data.password
    };

    localStorage.setItem('cg_users', JSON.stringify([newUser, ...localUsers]));

    // 4. Create default license
    const newLicense = {
      id: `LIC-${Math.floor(100 + Math.random() * 900)}`,
      clientId: newClient.id,
      clientName: newClient.organizationName,
      planId: 'plan-pro',
      status: 'Activa',
      activationDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      enabledModuleCodes: ['dashboard', 'campana', 'electores', 'lideres', 'comunicaciones', 'ia']
    };

    const savedLicenses = JSON.parse(localStorage.getItem('cg_licenses') || JSON.stringify(INITIAL_LICENSES));
    localStorage.setItem('cg_licenses', JSON.stringify([newLicense, ...savedLicenses]));

    // 5. Create default subscription
    const newSubscription = {
      id: `SUB-${Math.floor(100 + Math.random() * 900)}`,
      clientId: newClient.id,
      planId: 'plan-pro',
      status: 'Activa',
      period: 'Anual',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      price: 2400000
    };

    const savedSubs = JSON.parse(localStorage.getItem('cg_subscriptions') || JSON.stringify(INITIAL_SUBSCRIPTIONS));
    localStorage.setItem('cg_subscriptions', JSON.stringify([newSubscription, ...savedSubs]));

    // 6. Create default campaign
    const newCampaign = {
      id: `CAMP-${Math.floor(100 + Math.random() * 900)}`,
      name: data.campaignName,
      clientId: newClient.id,
      clientName: newClient.organizationName,
      status: 'Activo',
      candidateName: data.fullName,
      type: 'Alcaldía',
      budget: 50000000,
      createdAt: new Date().toISOString()
    };

    const savedCampaigns = JSON.parse(localStorage.getItem('cg_campaigns') || JSON.stringify(INITIAL_CAMPAIGNS));
    localStorage.setItem('cg_campaigns', JSON.stringify([newCampaign, ...savedCampaigns]));

    // 7. Set Session
    const userObj = {
      id: newUser.id,
      email: newUser.email,
      user_metadata: { name: newUser.name },
      role: 'admin'
    };
    localStorage.setItem('cg_session', JSON.stringify(userObj));

    return {
      success: true,
      panelUrl: '#'
    };
  } catch (err: any) {
    console.error('Error registering local client:', err);
    return { success: false, error: err?.message || 'Error inesperado al crear la cuenta.' };
  }
}

/**
 * Save a Demo Request or Lead Inquiry locally
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
    const savedLeads = JSON.parse(localStorage.getItem('cg_demo_leads') || '[]');
    const newLead = {
      ...lead,
      id: `lead-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('cg_demo_leads', JSON.stringify([newLead, ...savedLeads]));
    console.log('📈 Lead guardado localmente:', newLead);
    return { success: true, data: newLead };
  } catch (err: any) {
    console.error('Error saving lead locally:', err);
    return { success: false, error: err?.message };
  }
}
