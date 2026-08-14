// Mock InsForge client that executes all database operations 100% locally in the browser using localStorage.
// Bypasses all backend HTTP calls, making the frontend completely autonomous and offline.

import {
  INITIAL_CLIENTS,
  INITIAL_LICENSES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USERS,
  INITIAL_PLANS,
  INITIAL_MODULES,
  INITIAL_ROLES,
  INITIAL_CAMPAIGNS,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';

// Helper to initialize and get localStorage data for a collection
export function getLocalCollection(collectionName: string): any[] {
  const key = `cg_${collectionName}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Error parsing cg_${collectionName}:`, e);
    }
  }

  // Fallback initial seeds
  let initialSeed: any[] = [];
  switch (collectionName) {
    case 'clients': initialSeed = INITIAL_CLIENTS; break;
    case 'licenses': initialSeed = INITIAL_LICENSES; break;
    case 'subscriptions': initialSeed = INITIAL_SUBSCRIPTIONS; break;
    case 'users': 
    case 'users_list': initialSeed = INITIAL_USERS; break;
    case 'plans': initialSeed = INITIAL_PLANS; break;
    case 'modules': initialSeed = INITIAL_MODULES; break;
    case 'roles': initialSeed = INITIAL_ROLES; break;
    case 'campaigns': initialSeed = INITIAL_CAMPAIGNS; break;
    case 'invoices': initialSeed = INITIAL_INVOICES; break;
    case 'audit_logs':
    case 'audit': initialSeed = INITIAL_AUDIT_LOGS; break;
    case 'notifications': initialSeed = INITIAL_NOTIFICATIONS; break;
    default: initialSeed = [];
  }

  localStorage.setItem(key, JSON.stringify(initialSeed));
  return initialSeed;
}

// Helper to set localStorage data for a collection
export function saveLocalCollection(collectionName: string, data: any[]): void {
  const key = `cg_${collectionName}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function syncLocalUsersRecords(records: any[]) {
  if (!Array.isArray(records) || records.length === 0) return;
  const current = getLocalCollection('users');
  const map = new Map<string, any>();
  current.forEach(u => map.set(u.email || u.id, u));
  
  records.forEach(r => {
    if (!r) return;
    const email = (r.email || '').trim().toLowerCase();
    const id = r.id || `u-${email}`;
    const fullName = r.name || `${r.first_name || r.firstName || ''} ${r.last_name || r.lastName || ''}`.trim() || email.split('@')[0];
    const roleId = r.role_id || r.roleId || r.role || 'admin';
    const roleName = r.role_name || r.roleName || (roleId === 'admin' ? 'Gestión Administrativa' : roleId === 'estrategico' ? 'Gestión Estratégica' : 'Gestión Territorial');

    const norm = {
      id,
      email,
      name: fullName,
      role_id: roleId,
      role_name: roleName,
      client_id: r.client_id || r.clientId || 'client-101',
      client_name: r.client_name || r.clientName || 'Campaña Principal',
      status: r.status || 'Activo',
      created_at: r.created_at || r.createdAt || new Date().toISOString(),
      password: r.password || r.passwordHash || 'password'
    };
    map.set(email || id, norm);
  });

  const allUsers = Array.from(map.values());
  saveLocalCollection('users', allUsers);
  localStorage.setItem('campaign_users_list', JSON.stringify(allUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role_id,
    status: u.status,
    password: u.password
  }))));
}

export const insforge = {
  database: {
    from(table: string) {
      // Normalize table names
      const collectionName = table === 'users_list' ? 'users' : table;
      
      return {
        select(fields: string = '*') {
          const filters: Array<{ field: string; value: any }> = [];
          
          const execute = async () => {
            let data = getLocalCollection(collectionName);

            // Apply filters
            filters.forEach(f => {
              if (f.field === 'email') {
                const searchEmail = String(f.value).trim().toLowerCase();
                data = data.filter((item: any) => 
                  item.email && String(item.email).trim().toLowerCase() === searchEmail
                );
              } else {
                data = data.filter((item: any) => String(item[f.field]) === String(f.value));
              }
            });
            
            return { data, error: null };
          };

          return {
            eq(field: string, value: any) {
              filters.push({ field, value });
              return this;
            },
            then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
              return execute().then(onfulfilled, onrejected);
            },
            catch(onrejected?: (reason: any) => any) {
              return execute().catch(onrejected);
            }
          };
        },
        
        insert(records: any[]) {
          return (async () => {
            const data = getLocalCollection(collectionName);
            const updated = [...records, ...data];
            saveLocalCollection(collectionName, updated);

            // Sync user list helper if applicable
            if (collectionName === 'users') {
              syncLocalUsersRecords(records);
            }
            
            return { data: records, error: null };
          })();
        },
        
        update(updateData: any) {
          return {
            eq(field: string, value: any) {
              return (async () => {
                const data = getLocalCollection(collectionName);
                const updated = data.map((item: any) => {
                  if (String(item[field]) === String(value)) {
                    return { ...item, ...updateData };
                  }
                  return item;
                });
                saveLocalCollection(collectionName, updated);
                
                // Sync user list helper if applicable
                if (collectionName === 'users') {
                  syncLocalUsersRecords(updated);
                }

                return { data: updateData, error: null };
              })();
            }
          };
        },
        
        delete() {
          return {
            eq(field: string, value: any) {
              return (async () => {
                const data = getLocalCollection(collectionName);
                const updated = data.filter((item: any) => String(item[field]) !== String(value));
                saveLocalCollection(collectionName, updated);

                // Sync user list helper if applicable
                if (collectionName === 'users') {
                  localStorage.setItem('campaign_users_list', JSON.stringify(updated.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role_id,
                    status: u.status,
                    password: u.password
                  }))));
                }

                return { data: null, error: null };
              })();
            }
          };
        }
      };
    }
  },
  
  async rpc(name: string, params: any) {
    console.log('⚡ Local RPC Called:', name, params);
    // Simulate common RPC operations
    return { data: true, error: null };
  }
};
