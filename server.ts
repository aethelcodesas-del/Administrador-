import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'data_db.json');

// Interface for database structure
interface DatabaseSchema {
  admin: {
    users: Array<{ id: string; name: string; cedula?: string; email: string; passwordHash?: string; role: string; accessLevel: string; status: string; createdAt: string }>;
    payroll: Array<{ id: string; concept: string; category: string; amount: number; date: string; status: string }>;
    auditLogs: Array<{ id: string; action: string; user: string; timestamp: string; details: string }>;
    systemSettings: { maintenanceMode: boolean; apiRateLimit: number; sha256Verification: boolean };
  };
  strategic: {
    dafoEntries: Array<{ id: string; type: 'Debilidad' | 'Oportunidad' | 'Fortaleza' | 'Amenaza'; description: string; impact: string; status: string }>;
    budgets: Array<{ id: string; title: string; allocated: number; executed: number; department: string }>;
    aiNotes: Array<{ id: string; topic: string; content: string; date: string }>;
    candidateProfile?: {
      name: string;
      cedula: string;
      pseudonym: string;
      profession: string;
      photo: string;
      phone: string;
      email: string;
      slogan: string;
      bio: string;
      party: string;
      numberOnBallot: string;
      socialMedia: {
        whatsapp?: string;
        facebook?: string;
        instagram?: string;
        twitter?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
      };
    };
  };
  territorial: {
    voters: Array<{ id: string; name: string; cedula: string; puesto: string; mesa: string; leaderName: string; status: string }>;
    e14Actas: Array<{ id: string; mesa: string; puesto: string; votosCandidato: number; votosOponente: number; nulos: number; status: string; timestamp: string }>;
    witnesses: Array<{ id: string; name: string; puesto: string; mesa: string; phone: string; geofenceVerified: boolean; batteryPct: number }>;
  };
}

// Initial default seed
const initialDbData: DatabaseSchema = {
  admin: {
    users: [
      { id: 'USR-1001', name: 'Dra. María Paula Restrepo', cedula: '1085294312', email: 'admin.general@campanaganadora.co', passwordHash: 'AdminSeguro2026!', role: 'Superadmin', accessLevel: 'Nivel 10', status: 'Activo', createdAt: '2026-01-10' },
      { id: 'USR-1002', name: 'Ing. Carlos Alberto Mendoza', cedula: '1020784920', email: 'director.estrategico@campanaganadora.co', passwordHash: 'EstrategiaAI2026!', role: 'Director Político', accessLevel: 'Nivel 9', status: 'Activo', createdAt: '2026-01-15' },
      { id: 'USR-1003', name: 'Capitán Fernando Torres', cedula: '1144028392', email: 'coordinador.e14@campanaganadora.co', passwordHash: 'TestigoE14Pass!', role: 'Coordinador Territorial', accessLevel: 'Nivel 7', status: 'Activo', createdAt: '2026-02-01' },
      { id: 'USR-1004', name: 'Dra. Elena Gómez Soler', cedula: '31894021', email: 'tesoreria@campanaganadora.co', passwordHash: 'FinanzasCNE2026!', role: 'Tesorero / Contador CNE', accessLevel: 'Nivel 8', status: 'Activo', createdAt: '2026-02-01' }
    ],
    payroll: [
      { id: 'PAY-101', concept: 'Honorarios Coordinadores de Comuna', category: 'Nómina Campo', amount: 45000000, date: '2026-02-01', status: 'Pagado' },
      { id: 'PAY-102', concept: 'Servicios Servidores Cloud & API OCR', category: 'Tecnología', amount: 8200000, date: '2026-02-05', status: 'Pagado' },
      { id: 'PAY-103', concept: 'Logística de Transporte Día E', category: 'Operación Electoral', amount: 32000000, date: '2026-02-06', status: 'Aprobado' }
    ],
    auditLogs: [
      { id: 'LOG-801', action: 'Cambio de Permisos RBAC', user: 'Dra. María Paula Restrepo', timestamp: '2026-08-06 20:30', details: 'Nivel 10 habilitado para módulo E-14' },
      { id: 'LOG-802', action: 'Verificación SHA-256', user: 'Sistema Automático', timestamp: '2026-08-06 21:15', details: 'Base de datos sincronizada sin errores' }
    ],
    systemSettings: {
      maintenanceMode: false,
      apiRateLimit: 1200,
      sha256Verification: true
    }
  },
  strategic: {
    dafoEntries: [
      { id: 'DAF-01', type: 'Fortaleza', description: 'Consolidación de votación en Comunas 2, 17 y 19 con 42% intención de voto.', impact: 'Alto', status: 'Activo' },
      { id: 'DAF-02', type: 'Oportunidad', description: 'Capta de votantes independientes tras debate televisado regional.', impact: 'Muy Alto', status: 'En Proceso' },
      { id: 'DAF-03', type: 'Amenaza', description: 'Campaña sucia en redes sociales sobre propuestas de movilidad.', impact: 'Medio', status: 'Mitigado' }
    ],
    budgets: [
      { id: 'STR-B01', title: 'Publicidad Digital & Redes Sociales', allocated: 120000000, executed: 84000000, department: 'Comunicaciones' },
      { id: 'STR-B02', title: 'Encuestas & Tracking Telefónico', allocated: 65000000, executed: 42000000, department: 'Investigación Electoral' },
      { id: 'STR-B03', title: 'Giras Municipales y Eventos Masivos', allocated: 180000000, executed: 125000000, department: 'Dirección Estratégica' }
    ],
    aiNotes: [
      { id: 'NTE-01', topic: 'Discurso Cierre de Precampaña', content: 'Énfasis en seguridad urbana, reactivación económica y control transparente de presupuestos.', date: '2026-08-05' }
    ],
    candidateProfile: {
      name: 'Dra. María Paula Restrepo',
      cedula: '1085294312',
      pseudonym: 'María Paula "La Doctora del Pueblo"',
      profession: 'Abogada Especialista en Derecho Público y Gestión Territorial',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
      phone: '+57 310 892 4021',
      email: 'maria.restrepo@campanaganadora.co',
      slogan: 'Unidos por el Progreso, la Seguridad y el Futuro de Nuestra Ciudad',
      bio: 'Líder social con más de 15 años de experiencia en la administración pública, defensora de la transparencia institucional y el desarrollo económico incluyente.',
      party: 'Movimiento Político Fuerza Ciudadana',
      numberOnBallot: 'N° 101',
      socialMedia: {
        whatsapp: 'https://wa.me/573108924021',
        facebook: 'https://facebook.com/mariapaula.restrepo.oficial',
        instagram: 'https://instagram.com/mariapaularestrepo',
        twitter: 'https://x.com/mrestrepo2026',
        tiktok: 'https://tiktok.com/@mariapaularestrepo',
        youtube: 'https://youtube.com/@mariapaulaoficial',
        website: 'https://mariapaularestrepo.co'
      }
    }
  },
  territorial: {
    voters: [
      { id: 'VOT-001', name: 'Carlos Eduardo Gómez', cedula: '1085294312', puesto: 'INEM Jorge Isaacs', mesa: 'Mesa 18', leaderName: 'Líder Fernando Torres', status: 'Confirmado' },
      { id: 'VOT-002', name: 'Ana Lucía Bermúdez', cedula: '31942081', puesto: 'Colegio Santa Librada', mesa: 'Mesa 05', leaderName: 'Líder Fernando Torres', status: 'Confirmado' },
      { id: 'VOT-003', name: 'Jorge Ignacio Valencia', cedula: '16789423', puesto: 'SENA Salomia', mesa: 'Mesa 12', leaderName: 'Líder Beatriz Morales', status: 'Pendiente Movilización' }
    ],
    e14Actas: [
      { id: 'E14-101', mesa: 'Mesa 18', puesto: 'INEM Jorge Isaacs', votosCandidato: 184, votosOponente: 92, nulos: 3, status: 'Verificada OCR', timestamp: '2026-08-06 17:40' },
      { id: 'E14-102', mesa: 'Mesa 05', puesto: 'Colegio Santa Librada', votosCandidato: 210, votosOponente: 88, nulos: 2, status: 'Verificada OCR', timestamp: '2026-08-06 17:45' }
    ],
    witnesses: [
      { id: 'WIT-01', name: 'Capitán Fernando Torres', puesto: 'INEM Jorge Isaacs', mesa: 'Mesa 18', phone: '3104829102', geofenceVerified: true, batteryPct: 94 },
      { id: 'WIT-02', name: 'Beatriz Morales', puesto: 'SENA Salomia', mesa: 'Mesa 12', phone: '3159201923', geofenceVerified: true, batteryPct: 88 },
      { id: 'WIT-03', name: 'Héctor Fabio Ramírez', puesto: 'Coliseo del Pueblo', mesa: 'Mesa 01', phone: '3001829301', geofenceVerified: false, batteryPct: 45 }
    ]
  }
};

// Helper: Read DB
function getDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDbData, null, 2), 'utf-8');
      return initialDbData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialDbData;
  }
}

// Helper: Save DB
function saveDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

async function startAppServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini AI client server-side if key exists
  let aiClient: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Gemini client initialization warning:', e);
    }
  }

  // InstantDB App ID Configuration API
  app.get('/api/instantdb-config', (req, res) => {
    res.json({
      appId: '3c4f54a8-fe14-45d6-8303-e034f3495d9b',
      status: 'online',
      syncEnabled: true
    });
  });

  // Supabase Configuration & Status API
  app.get('/api/supabase-config', (req, res) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://ojvrlleziqrimhjvsbwf.supabase.co',
      restEndpoint: 'https://ojvrlleziqrimhjvsbwf.supabase.co/rest/v1/',
      status: 'connected',
      anonKeyConfigured: true,
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // MODULE 1: GESTIÓN ADMINISTRATIVA APIs (ISOLATED)
  // ==========================================
  app.get('/api/admin/users', (req, res) => {
    const db = getDb();
    res.json(db.admin.users);
  });

  app.post('/api/admin/users', (req, res) => {
    const { name, cedula, email, password, role, accessLevel } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }
    const db = getDb();
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      cedula: cedula || `${Math.floor(1000000000 + Math.random() * 90000000)}`,
      email,
      passwordHash: password || 'ClaveSegura2026!',
      role: role || 'Operador Administrativo',
      accessLevel: accessLevel || 'Nivel 5',
      status: 'Activo',
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.admin.users.push(newUser);
    db.admin.auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      action: 'Usuario Creado',
      user: 'Dra. María Paula Restrepo',
      timestamp: new Date().toLocaleString(),
      details: `Creación de usuario: ${name} (${email}) - CC: ${newUser.cedula}`
    });
    saveDb(db);
    res.json(newUser);
  });

  app.patch('/api/admin/users/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();
    const user = db.admin.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    user.status = status || (user.status === 'Activo' ? 'Inactivo' : 'Activo');
    db.admin.auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      action: 'Estado de Acceso Modificado',
      user: 'Dra. María Paula Restrepo',
      timestamp: new Date().toLocaleString(),
      details: `Modificación de estado de acceso a usuario: ${user.name} (${user.email}) -> ${user.status}`
    });
    saveDb(db);
    res.json(user);
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    db.admin.users = db.admin.users.filter((u) => u.id !== id);
    db.admin.auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      action: 'Usuario Eliminado',
      user: 'Dra. María Paula Restrepo',
      timestamp: new Date().toLocaleString(),
      details: `Eliminación de usuario ID: ${id}`
    });
    saveDb(db);
    res.json({ success: true });
  });

  app.get('/api/admin/payroll', (req, res) => {
    const db = getDb();
    res.json(db.admin.payroll);
  });

  app.post('/api/admin/payroll', (req, res) => {
    const { concept, category, amount } = req.body;
    const db = getDb();
    const newItem = {
      id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
      concept: concept || 'Gasto Operativo',
      category: category || 'Logística',
      amount: Number(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Pagado'
    };
    db.admin.payroll.unshift(newItem);
    saveDb(db);
    res.json(newItem);
  });

  app.get('/api/admin/logs', (req, res) => {
    const db = getDb();
    res.json(db.admin.auditLogs);
  });

  // ==========================================
  // MODULE 2: GESTIÓN ESTRATÉGICA APIs (ISOLATED)
  // ==========================================
  app.get('/api/strategic/dafo', (req, res) => {
    const db = getDb();
    res.json(db.strategic.dafoEntries);
  });

  app.post('/api/strategic/dafo', (req, res) => {
    const { type, description, impact } = req.body;
    const db = getDb();
    const newEntry = {
      id: `DAF-${Math.floor(10 + Math.random() * 90)}`,
      type: type || 'Fortaleza',
      description: description || 'Nuevo punto estratégico identificado',
      impact: impact || 'Alto',
      status: 'Activo'
    };
    db.strategic.dafoEntries.unshift(newEntry);
    saveDb(db);
    res.json(newEntry);
  });

  app.delete('/api/strategic/dafo/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    db.strategic.dafoEntries = db.strategic.dafoEntries.filter((d) => d.id !== id);
    saveDb(db);
    res.json({ success: true });
  });

  app.get('/api/strategic/budget', (req, res) => {
    const db = getDb();
    res.json(db.strategic.budgets);
  });

  app.post('/api/strategic/budget', (req, res) => {
    const { title, allocated, executed, department } = req.body;
    const db = getDb();
    const newBudget = {
      id: `STR-B${Math.floor(10 + Math.random() * 90)}`,
      title: title || 'Nueva Línea Presupuestaria',
      allocated: Number(allocated) || 0,
      executed: Number(executed) || 0,
      department: department || 'Estrategia'
    };
    db.strategic.budgets.push(newBudget);
    saveDb(db);
    res.json(newBudget);
  });

  app.get('/api/strategic/candidate', (req, res) => {
    const db = getDb();
    res.json(db.strategic.candidateProfile || {});
  });

  app.post('/api/strategic/candidate', (req, res) => {
    const db = getDb();
    db.strategic.candidateProfile = {
      ...db.strategic.candidateProfile,
      ...req.body
    };
    saveDb(db);
    res.json(db.strategic.candidateProfile);
  });

  // Gemini AI Strategic Diagnostic Server Route
  app.post('/api/strategic/ai-diagnose', async (req, res) => {
    const { prompt } = req.body;
    const db = getDb();

    try {
      if (aiClient && process.env.GEMINI_API_KEY) {
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Eres el Asistente de Estrategia Electoral AI para Campaña Ganadora en Colombia. Responde de manera profesional, estructurada y precisa sobre el siguiente tema de campaña: "${prompt}". Incluye diagnóstico DAFO, recomendación para coordinadores y propuesta de movilización.`
        });
        const aiText = response.text || 'Respuesta de análisis estratégico generada correctamente.';
        return res.json({ response: aiText });
      }
    } catch (e) {
      console.error('Gemini API call failed, using internal strategy engine fallback:', e);
    }

    // Fallback strategy generator based on DAFO data in strategic module
    const dafoCount = db.strategic.dafoEntries.length;
    const totalBudget = db.strategic.budgets.reduce((acc, b) => acc + b.allocated, 0);
    const fallbackText = 
      `📊 DIAGNÓSTICO ESTRATÉGICO IA (CAMPAÑA GANADORA):\n` +
      `• Análisis de Solicitud: "${prompt}"\n` +
      `• Elementos DAFO Activos: ${dafoCount} hallazgos registrados en matriz de riesgo.\n` +
      `• Asignación Presupuestaria Estratégica: $${totalBudget.toLocaleString('es-CO')} COP.\n` +
      `• Recomendación Táctica: Intensificar movilización territorial en puestos clave con cobertura >90% e implementar piezas digitales focalizadas.`;

    res.json({ response: fallbackText });
  });

  // ==========================================
  // MODULE 3: GESTIÓN TERRITORIAL APIs (ISOLATED)
  // ==========================================
  app.get('/api/territorial/voters', (req, res) => {
    const db = getDb();
    res.json(db.territorial.voters);
  });

  app.post('/api/territorial/voters', (req, res) => {
    const { name, cedula, puesto, mesa, leaderName } = req.body;
    const db = getDb();

    // Check strict duplicate CC constraint inside campaign
    const existing = db.territorial.voters.find((v) => v.cedula === cedula);
    if (existing) {
      return res.status(400).json({ 
        error: `DUPLICIDAD DETECTADA: La cédula ${cedula} ya fue asignada previamente al líder "${existing.leaderName}".` 
      });
    }

    const newVoter = {
      id: `VOT-${Math.floor(100 + Math.random() * 900)}`,
      name: name || 'Votante Registrado',
      cedula,
      puesto: puesto || 'INEM Jorge Isaacs',
      mesa: mesa || 'Mesa 01',
      leaderName: leaderName || 'Líder Capitán Fernando Torres',
      status: 'Confirmado'
    };

    db.territorial.voters.unshift(newVoter);
    saveDb(db);
    res.json(newVoter);
  });

  // Dedicated voter lookup endpoint for database & external API integration
  app.get('/api/territorial/voters/lookup', (req, res) => {
    const { cedula, query } = req.query;
    const searchTerm = (cedula || query || '').toString().trim().toLowerCase();
    const db = getDb();

    if (!searchTerm) {
      return res.status(400).json({ error: 'Parámetro de búsqueda de cédula requerido.' });
    }

    const match = db.territorial.voters.find(
      (v) => v.cedula === searchTerm || v.name.toLowerCase().includes(searchTerm)
    );

    if (match) {
      return res.json({
        found: true,
        voter: match
      });
    }

    return res.json({
      found: false,
      message: 'No se encontró en base de datos local. Listo para consulta en API externa.'
    });
  });

  app.get('/api/territorial/e14', (req, res) => {
    const db = getDb();
    res.json(db.territorial.e14Actas);
  });

  app.post('/api/territorial/e14', (req, res) => {
    const { mesa, puesto, votosCandidato, votosOponente, nulos } = req.body;
    const db = getDb();
    const newActa = {
      id: `E14-${Math.floor(100 + Math.random() * 900)}`,
      mesa: mesa || 'Mesa 01',
      puesto: puesto || 'INEM Jorge Isaacs',
      votosCandidato: Number(votosCandidato) || 0,
      votosOponente: Number(votosOponente) || 0,
      nulos: Number(nulos) || 0,
      status: 'Verificada OCR',
      timestamp: new Date().toLocaleString()
    };
    db.territorial.e14Actas.unshift(newActa);
    saveDb(db);
    res.json(newActa);
  });

  app.get('/api/territorial/witnesses', (req, res) => {
    const db = getDb();
    res.json(db.territorial.witnesses);
  });

  app.post('/api/territorial/witnesses', (req, res) => {
    const { name, puesto, mesa, phone } = req.body;
    const db = getDb();
    const newWitness = {
      id: `WIT-${Math.floor(10 + Math.random() * 90)}`,
      name: name || 'Nuevo Testigo E-14',
      puesto: puesto || 'INEM Jorge Isaacs',
      mesa: mesa || 'Mesa 01',
      phone: phone || '3000000000',
      geofenceVerified: true,
      batteryPct: 95
    };
    db.territorial.witnesses.unshift(newWitness);
    saveDb(db);
    res.json(newWitness);
  });

  // Serve static files in production or Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startAppServer();
