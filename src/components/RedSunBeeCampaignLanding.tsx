import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { saveDemoLeadToSupabase, testSupabaseConnection, registerNewClient, PANEL_ADMIN_URL, SUPABASE_URL } from '../lib/supabase';
import {
  Sparkles,
  ArrowRight,
  ArrowUp,
  ShieldCheck,
  Zap,
  Users,
  MapPin,
  Vote,
  BarChart3,
  CheckCircle2,
  Lock,
  Bot,
  ChevronDown,
  Layers,
  Cpu,
  Star,
  Play,
  X,
  Menu,
  Calculator,
  Target,
  Send,
  Sliders,
  Database,
  Check,
  Building2,
  LayoutDashboard,
  Globe,
  Radio,
  FileText,
  Clock,
  Award,
} from 'lucide-react';

interface RedSunBeeCampaignLandingProps {
  onLogin?: () => void;
}

export const RedSunBeeCampaignLanding: React.FC<RedSunBeeCampaignLandingProps> = ({ onLogin }) => {
  // Navigation & Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTabDemo, setActiveTabDemo] = useState<'ai' | 'crm' | 'territory' | 'e14'>('ai');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Floating Scroll to Top button state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Local Notification Toast State
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'info' }>>([]);

  const addNotification = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Interactive FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive ROI Calculator State
  const [voterTarget, setVoterTarget] = useState<number>(50000);
  const [leaderCount, setLeaderCount] = useState<number>(35);

  // Interactive AI Demo State
  const [aiPromptInput, setAiPromptInput] = useState<string>('Estrategia de comunicación para votantes jóvenes indecisos');
  const [aiResponse, setAiResponse] = useState<string>(
    'Análisis Campaña Ganadora AI: Los jóvenes de 18-28 años en el sector urbano priorizan propuestas de empleo tecnológico y transporte sostenible. Se recomienda una campaña de video corto enfocada en 3 compromisos clave con tono cercano y datos transparentes.'
  );
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Registration / Sign Up Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalEmail, setModalEmail] = useState<string>('');
  const [modalPassword, setModalPassword] = useState<string>('');
  const [modalFullName, setModalFullName] = useState<string>('');
  const [modalCampaignName, setModalCampaignName] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalSubmitted, setModalSubmitted] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [registeredPanelUrl, setRegisteredPanelUrl] = useState<string>('');

  // Testimonial Filter State
  const [testimonialFilter, setTestimonialFilter] = useState<'all' | 'alcaldia' | 'asamblea' | 'senado'>('all');

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleSimulateAiPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    setIsAiGenerating(true);
    setAiResponse('Procesando consulta estratégica con modelo de lenguaje político Campaña Ganadora...');
    setTimeout(() => {
      setIsAiGenerating(false);
      setAiResponse(
        `Estrategia Generada para: "${aiPromptInput}":\n• Mensaje Fuerza: "Propuestas concretas con impacto medible en los primeros 100 días".\n• Canal Recomendado: Redes sociales + Volanteo focalizado en puesto de votación con mayor densidad.\n• Tasa de conversión proyectada: +18.4% sobre electorado neutro.`
      );
    }, 1200);
  };

  // Supabase Connection State
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string }>({
    connected: true,
    message: 'Conectando a Supabase...',
  });

  useEffect(() => {
    testSupabaseConnection().then((res) => {
      setDbStatus({
        connected: res.success,
        message: res.message,
      });
    });
  }, []);

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail.trim() || !modalPassword.trim() || !modalFullName.trim() || !modalCampaignName.trim()) return;
    
    // Basic password validation
    if (modalPassword.length < 8) {
      setModalError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    
    const result = await registerNewClient({
      fullName: modalFullName,
      email: modalEmail,
      password: modalPassword,
      campaignName: modalCampaignName,
      phone: modalPhone,
    });

    setModalLoading(false);

    if (!result.success) {
      setModalError(result.error || 'Error al registrar. Intenta nuevamente.');
      return;
    }

    setModalSubmitted(true);
    setRegisteredPanelUrl(result.panelUrl || PANEL_ADMIN_URL);
    addNotification(`¡Cuenta creada exitosamente para ${modalEmail}! Redirigiendo al Panel...`, 'success');

    setTimeout(() => {
      window.open(result.panelUrl || PANEL_ADMIN_URL, '_blank');
    }, 2000);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // ROI Calculations
  const estimatedHoursSavedPerWeek = Math.round((voterTarget / 1000) * 1.8 + leaderCount * 0.5);
  const projectedExtraVotes = Math.round(voterTarget * 0.14);
  const estimatedEfficiencyBonus = Math.min(98, Math.round(45 + (voterTarget / 10000) * 3));

  // Testimonials list
  const testimonials = [
    {
      id: 1,
      name: 'Carlos Andrés Mendoza',
      role: 'Candidato a Alcaldía Municipal',
      category: 'alcaldia',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      quote:
        'Campaña Ganadora AI transformó por completo el control de nuestra campaña. La velocidad para identificar zonas críticas y desplegar a nuestros líderes redujo el margen de error a cero.',
      metric: '+42% en intención de voto',
    },
    {
      id: 2,
      name: 'Dra. Elena Santamaría',
      role: 'Directora Estratégica para Asamblea',
      category: 'asamblea',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
      quote:
        'El módulo del Día D con verificación en tiempo real de formularios E-14 nos dio una tranquilidad absoluta durante el escrutinio. Es una herramienta tecnológica indispensable.',
      metric: '100% Mesas Cubiertas con Testigos',
    },
    {
      id: 3,
      name: 'Ing. Roberto Silva',
      role: 'Jefe de Operaciones Políticas - Senado',
      category: 'senado',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      quote:
        'El copiloto de inteligencia artificial nos ahorró semanas de trabajo en la redacción de discursos y mensajes adaptados a cada municipio. El ROI de esta plataforma es extraordinario.',
      metric: '85 horas/semana ahorradas',
    },
  ];

  const filteredTestimonials =
    testimonialFilter === 'all'
      ? testimonials
      : testimonials.filter((t) => t.category === testimonialFilter);

  // FAQ Items
  const faqItems = [
    {
      question: '¿Qué es Campaña Ganadora AI y cómo ayuda a mi campaña política?',
      answer:
        'Campaña Ganadora AI es una plataforma integral SaaS y de Inteligencia Artificial diseñada específicamente para campañas electorales en Colombia y América Latina. Combina CRM de votantes, mapas de calor territorial, copiloto de IA generativo, control presupuestal CNE y monitoreo del Día D (formularios E-14).',
    },
    {
      question: '¿Mis datos de votantes y estrategias están seguros y son privados?',
      answer:
        'Absolutamente. La plataforma cuenta con aislamiento estricto multi-inquilino (tenant isolation), encriptación de grado militar AES-256 en reposo y TLS 1.3 en tránsito. Ningún dato de tu campaña se comparte con terceros ni se utiliza para entrenar modelos públicos.',
    },
    {
      question: '¿Cómo funciona el monitoreo de mesas y escrutinio del Día D (E-14)?',
      answer:
        'La aplicación permite a los testigos electorales tomar fotografías de los formularios E-14 desde su celular. Nuestro motor OCR extrae los conteos de votos al instante y detecta discrepancias o fraudes con alertas automatizadas para el equipo jurídico.',
    },
    {
      question: '¿Se requiere instalación de software especializado en computadores?',
      answer:
        'No. Campaña Ganadora AI es una aplicación 100% web en la nube y optimizada para dispositivos móviles (smartphones y tablets). Puedes usarla desde cualquier navegador sin instalar nada.',
    },
    {
      question: '¿Puedo integrar la base de datos con Firestore o Cloud SQL existente?',
      answer:
        'Sí. Campaña Ganadora AI incluye integración nativa lista para conectarse con bases de datos en tiempo real Firestore y Cloud SQL PostgreSQL para sincronización continua de datos e informes.',
    },
    {
      question: '¿Cómo puedo solicitar una demostración personalizada para mi equipo?',
      answer:
        'Puedes solicitar una sesión interactiva personalizada haciendo clic en cualquier botón de "Probar Demo Instantánea" o agendando directamente en nuestro formulario de contacto en esta página.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#FF4D4D] selection:text-white relative overflow-x-clip">
      {/* Toast Notification Container */}
      <div className="fixed top-24 right-4 z-[100] space-y-2 pointer-events-none max-w-sm w-full">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="p-3.5 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md bg-emerald-950/90 text-emerald-200 border-emerald-500/50 pointer-events-auto flex items-center justify-between gap-2.5 animate-slide-up"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="flex-1">{n.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Background Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 transform-gpu">
        <div className="absolute top-[-10%] left-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#FF4D4D]/10 via-[#FF7A3D]/10 to-[#FF6B81]/10 blur-[100px] pointer-events-none opacity-60" />
        <div className="absolute bottom-[5%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-[#FF2E2E]/10 via-[#FF7A3D]/10 to-transparent blur-[110px] pointer-events-none opacity-50" />
      </div>

      {/* SECTION 1: NAVBAR (Anchored & Permanently Fixed at Top of Viewport) */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#080808]/95 border-b border-white/10 shadow-2xl shadow-black/90 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4D4D] via-[#FF7A3D] to-[#FF6B81] p-0.5 shadow-xl shadow-[#FF4D4D]/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#080808] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#FF4D4D] animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Campaña <span className="text-redsun-gradient font-black">Ganadora</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-300">
            <a href="#producto" className="hover:text-white transition-colors">
              Producto
            </a>
            <a href="#soluciones" className="hover:text-white transition-colors">
              Soluciones
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Demostración
            </a>
            <a href="#roi" className="hover:text-white transition-colors">
              Calculadora ROI
            </a>
            <a href="#precios" className="hover:text-white transition-colors">
              Precios
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Action Button: Iniciar Sesión */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              id="btn-nav-iniciar-sesion"
              onClick={() => onLogin?.()}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF4D4D] via-[#FF7A3D] to-[#FF6B81] hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-red-950/60 cursor-pointer flex items-center gap-2 border border-white/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>Iniciar Sesión</span>
            </button>
          </div>


          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Top Spacer for Fixed Header */}
      <div className="pt-20" />

      {/* MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-2xl flex flex-col justify-between p-6 md:hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4D4D] to-[#FF7A3D] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#080808] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#FF4D4D]" />
                </div>
              </div>
              <span className="text-base font-extrabold text-white">Campaña Ganadora AI</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-6 text-lg font-bold text-zinc-200 my-auto">
            <a
              href="#producto"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#FF4D4D] transition"
            >
              Producto & Módulos
            </a>
            <a
              href="#soluciones"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#FF4D4D] transition"
            >
              Soluciones Electorales
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#FF4D4D] transition"
            >
              Demo Interactiva
            </a>
            <a
              href="#roi"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#FF4D4D] transition"
            >
              Calculadora de ROI
            </a>
            <a
              href="#precios"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#FF4D4D] transition"
            >
              Planes y Precios
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#FF4D4D] transition"
            >
              Preguntas Frecuentes
            </a>
          </nav>

          <div className="space-y-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin?.();
              }}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#FF4D4D] via-[#FF7A3D] to-[#FF6B81] text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setIsModalOpen(true); }}
              className="w-full py-3.5 rounded-full bg-white/10 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Crear Cuenta Gratis</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative pt-12 lg:pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10"
      >
        <div className="text-center space-y-8 max-w-4xl mx-auto">


          {/* Fluid Cinematic Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-redsun-hero font-black text-white tracking-tight"
          >
            La Plataforma de <span className="text-redsun-gradient">Inteligencia Artificial</span> para Campañas Políticas
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed"
          >
            Centraliza la gestión estratégica de votantes, territorialización de líderes, control financiero CNE y monitoreo del Día D con tecnología generativa de última generación.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="redsun-btn-primary w-full sm:w-auto text-sm sm:text-base py-4 px-8"
            >
              <span>Comenzar Prueba Gratuita</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#demo"
              className="redsun-btn-secondary w-full sm:w-auto text-sm sm:text-base py-4 px-8"
            >
              <Play className="w-4 h-4 text-[#FF4D4D] fill-current" />
              <span>Ver Demo Interactiva</span>
            </a>
          </motion.div>


        </div>


      </motion.section>

      {/* SECTION 3: LOGOS / TRUST MARQUEE */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.6 }}
        className="py-12 border-y border-white/10 bg-[#080808]/90 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Confianza respaldada por líderes, partidos y agencias de consultoría política
          </p>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="animate-redsun-marquee flex items-center gap-12 sm:gap-20">
            {[
              'ALCALDÍA MUNICIPAL 2027',
              'SENADO COLOMBIA DE HOY',
              'CONSEJO TERRITORIAL',
              'ASAMBLEA DEPARTAMENTAL',
              'MOVIMIENTO CIUDADANO',
              'AGENCIA ESTRATEGIA POLÍTICA',
              'SISTEMA CNE COMPLIANT',
              'ALCALDÍA MUNICIPAL 2027',
              'SENADO COLOMBIA DE HOY',
              'CONSEJO TERRITORIAL',
            ].map((logo, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 shrink-0 text-sm font-extrabold tracking-wide text-zinc-300 hover:text-white hover:border-[#FF4D4D]/40 transition cursor-default"
              >
                <Award className="w-4 h-4 text-[#FF4D4D]" />
                <span>{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: PROBLEMA VS SOLUCIÓN */}
      <motion.section
        id="soluciones"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-redsun-h2 font-black text-white">
            De la Desorganización Tradicional a la <span className="text-redsun-gradient">Inteligencia Automatizada</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Las campañas modernas ya no pueden guiarse por corazonadas o archivos de Excel dispersos. Campaña Ganadora AI integra todas tus áreas de operaciones en una sola fuente de verdad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card: Tradicional */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-8 rounded-[28px] bg-red-950/20 border border-red-500/20 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
              <X className="w-4 h-4" />
              <span>Gestión Tradicional Fraccionada</span>
            </div>
            <ul className="space-y-4 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Listas de votantes en hojas de cálculo desactualizadas e inseguras.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Cero visibilidad en tiempo real del trabajo de líderes y coordinadores.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Escrutinio del Día D a ciegas, con demoras para detectar alteraciones E-14.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Riesgo de sanciones por mal manejo de topes presupuestales del CNE.</span>
              </li>
            </ul>
          </motion.div>

          {/* Card: RedSun Solution */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 rounded-[28px] bg-gradient-to-br from-[#FF4D4D]/15 via-transparent to-[#FF7A3D]/10 border border-[#FF4D4D]/40 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 text-[#FF4D4D]/10 pointer-events-none">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF4D4D] to-[#FF7A3D] text-white text-xs font-bold shadow-lg">
              <Check className="w-4 h-4" />
              <span>Ecosistema Campaña Ganadora AI</span>
            </div>
            <ul className="space-y-4 text-xs sm:text-sm text-white font-medium">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#FF4D4D] shrink-0" />
                <span>CRM unificado con segmentación automática por municipios y mesas.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#FF4D4D] shrink-0" />
                <span>Mapas de calor en vivo que muestran el avance de votos objetivo por comuna.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#FF4D4D] shrink-0" />
                <span>Validación de actas E-14 mediante OCR con alertas inmediatas de fraude.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#FF4D4D] shrink-0" />
                <span>Control financiero automatizado categorizado bajo normatividad colombiana.</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 5: CARACTERÍSTICAS PRINCIPALES (BENTO GRID) */}
      <motion.section
        id="producto"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-redsun-h2 font-black text-white">
            Diseñado para Ganar en <span className="text-redsun-gradient">Cualquier Territorio</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Cada módulo ha sido construido pensando en la rapidez, facilidad de uso y máxima seguridad para candidatos y equipos de trabajo.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: Copiloto IA (Large) */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-2 redsun-card p-8 space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4D4D] to-[#FF7A3D] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#080808] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-[#FF4D4D]" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">
                Copiloto de Inteligencia Artificial Político
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Genera discursos persuasivos, comunicados de prensa, respuestas para debates y contenido para redes sociales alineado 100% con tu programa de gobierno.
              </p>
            </div>
          </motion.div>

          {/* Bento Card 2: CRM Votantes */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="redsun-card p-8 space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7A3D] to-[#FF6B81] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#080808] rounded-[14px] flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#FF7A3D]" />
                </div>
              </div>
              <h3 className="text-xl font-black text-white">CRM de Votantes & Líderes</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Registra simpatizantes, asigna compromisos a líderes de barrio y realiza seguimiento en tiempo real de metas de votación.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-2 border-t border-white/10">
              <span>98.2% Datos Validados</span>
              <Users className="w-4 h-4" />
            </div>
          </motion.div>

          {/* Bento Card 3: Territorio & Heatmaps */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="redsun-card p-8 space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4D4D] to-[#FF6B81] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#080808] rounded-[14px] flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#FF6B81]" />
                </div>
              </div>
              <h3 className="text-xl font-black text-white">Geolocalización & Heatmaps</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Mapea puestos de votación, densidad de simpatizantes y zonas de riesgo para enfocar el esfuerzo de la campaña.
              </p>
            </div>
          </motion.div>

          {/* Bento Card 4: Operación Día D (Large) */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="md:col-span-2 redsun-card p-8 space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF2E2E] to-[#FF7A3D] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#080808] rounded-[14px] flex items-center justify-center">
                  <Vote className="w-6 h-6 text-[#FF2E2E]" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">
                Operación Día D & OCR de Formularios E-14
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Control total el día de la elección. Cobertura de testigos en mesa, reporte de asistencia de votantes y captura fotográfica de actas E-14 con auditoría inmediata.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 6: PRODUCT SHOWCASE (INTERACTIVE DEMO SIMULATOR) */}
      <motion.section
        id="demo"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-redsun-h2 font-black text-white">
            Demostración <span className="text-redsun-gradient">Interactiva</span> de la Plataforma
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Explora las capacidades en tiempo real haciendo clic en las pestañas a continuación.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { id: 'ai', label: 'Copiloto IA Generativo', icon: Bot },
            { id: 'crm', label: 'CRM & Líderes', icon: Users },
            { id: 'territory', label: 'Control Territorial', icon: MapPin },
            { id: 'e14', label: 'Escrutinio Día D (E-14)', icon: Vote },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabDemo === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabDemo(tab.id as any)}
                className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2.5 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF4D4D] via-[#FF7A3D] to-[#FF6B81] text-white shadow-xl shadow-[#FF4D4D]/20 scale-105'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Showcase Canvas */}
        <div className="p-6 sm:p-10 rounded-[32px] bg-[#111111] border border-white/15 shadow-2xl space-y-6">
          {activeTabDemo === 'ai' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FF4D4D]/20 text-[#FF4D4D]">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Generador de Inteligencia Política</h4>
                    <p className="text-xs text-zinc-400">Prueba cómo responde la IA a un requerimiento de tu campaña</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSimulateAiPrompt} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    placeholder="Escribe un tema o instrucción para el copiloto..."
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#FF4D4D]"
                  />
                  <button
                    type="submit"
                    disabled={isAiGenerating}
                    className="redsun-btn-primary text-xs shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAiGenerating ? 'Generando...' : 'Ejecutar IA'}</span>
                  </button>
                </div>
              </form>

              <div className="p-5 rounded-2xl bg-black/80 border border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-[#FF7A3D] font-bold block">
                  RESULTADO SIMULADO REDSUN AI:
                </span>
                <p className="text-xs sm:text-sm text-zinc-200 font-mono whitespace-pre-line leading-relaxed">
                  {aiResponse}
                </p>
              </div>
            </div>
          )}

          {activeTabDemo === 'crm' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h4 className="text-base font-bold text-white">Segmentación de Votantes en CRM</h4>
                <span className="text-xs text-emerald-400 font-bold">1,240 Contactos Registrados</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs text-zinc-400 font-bold">Voto Seguro</span>
                  <span className="text-2xl font-black text-emerald-400">28,450</span>
                  <span className="text-[10px] text-zinc-500 block">63% de la Meta</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs text-zinc-400 font-bold">Indecisos Objetivo</span>
                  <span className="text-2xl font-black text-amber-400">12,100</span>
                  <span className="text-[10px] text-zinc-500 block">Atención Prioritaria</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs text-zinc-400 font-bold">Líderes de Zona</span>
                  <span className="text-2xl font-black text-[#FF7A3D]">48</span>
                  <span className="text-[10px] text-zinc-500 block">En Terreno</span>
                </div>
              </div>
            </div>
          )}

          {activeTabDemo === 'territory' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h4 className="text-base font-bold text-white">Mapa de Cobertura por Puestos de Votación</h4>
                <span className="text-xs text-[#FF4D4D] font-bold">12 Comunas Monitoreadas</span>
              </div>
              <div className="p-6 rounded-2xl bg-black/60 border border-white/10 text-center space-y-3">
                <MapPin className="w-10 h-10 text-[#FF4D4D] mx-auto animate-bounce" />
                <p className="text-xs text-zinc-300">
                  Visualiza municipios y concentraciones de simpatizantes con actualización en tiempo real desde la app móvil.
                </p>
              </div>
            </div>
          )}

          {activeTabDemo === 'e14' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h4 className="text-base font-bold text-white">Auditoría E-14 Día D en Vivo</h4>
                <span className="text-xs text-emerald-400 font-bold">Sin Discrepancias Detectadas</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">Mesa #12 • Colegio San José</span>
                    <span className="text-[11px] text-zinc-400">142 Votos Contabilizados OK</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  E-14 Verificado
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* SECTION 7: CALCULADORA DE ROI Y BENEFICIOS */}
      <motion.section
        id="roi"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-redsun-h2 font-black text-white">
            Calcula el Impacto en <span className="text-redsun-gradient">Tu Campaña</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Ajusta la cantidad de votantes objetivo y líderes para estimar las horas ahorradas y el incremento en eficiencia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Sliders Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-8 rounded-[28px] bg-[#111111] border border-white/10 space-y-8"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-300">Votantes Objetivo</span>
                <span className="text-[#FF4D4D] text-sm font-black">
                  {voterTarget.toLocaleString('es-CO')} Votantes
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="200000"
                step="5000"
                value={voterTarget}
                onChange={(e) => setVoterTarget(Number(e.target.value))}
                className="w-full accent-[#FF4D4D] cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-300">Líderes de Territorio</span>
                <span className="text-[#FF7A3D] text-sm font-black">{leaderCount} Líderes</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                value={leaderCount}
                onChange={(e) => setLeaderCount(Number(e.target.value))}
                className="w-full accent-[#FF7A3D] cursor-pointer"
              />
            </div>
          </motion.div>

          {/* Results Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 rounded-[28px] bg-gradient-to-br from-[#FF4D4D]/20 via-transparent to-[#FF6B81]/15 border border-[#FF4D4D]/40 space-y-6 text-center lg:text-left"
          >
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF4D4D] block">
              RESULTADOS PROYECTADOS
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                <span className="text-3xl font-black text-white">{estimatedHoursSavedPerWeek}h</span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-1">Ahorradas / semana</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                <span className="text-3xl font-black text-emerald-400">+{projectedExtraVotes.toLocaleString('es-CO')}</span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-1">Votos Estimados RedSun</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                <span className="text-3xl font-black text-[#FF7A3D]">{estimatedEfficiencyBonus}%</span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-1">Aumento en Eficiencia</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 8: FUNCIONAMIENTO / PASO A PASO */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 border-t border-white/10"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-redsun-h2 font-black text-white">
            Despliegue en <span className="text-redsun-gradient">4 Pasos Sencillos</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Configuración Inicial',
              desc: 'Crea el perfil de tu campaña, define el departamento, municipio y carga tus metas de votos.',
            },
            {
              step: '02',
              title: 'Entrenamiento IA',
              desc: 'Sube tu programa de gobierno para personalizar las respuestas del copiloto político.',
            },
            {
              step: '03',
              title: 'Registro de Territorio',
              desc: 'Asigna líderes por comunas y coordina la recepción de simpatizantes en el CRM.',
            },
            {
              step: '04',
              title: 'Escrutinio & Victoria',
              desc: 'Monitorea las mesas el Día D con OCR E-14 para proteger cada voto logrado.',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="redsun-card p-6 space-y-4"
            >
              <span className="text-3xl font-black text-redsun-gradient">{item.step}</span>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>



      {/* SECTION 10: TESTIMONIOS */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-redsun-h2 font-black text-white">
            Lo que Dicen <span className="text-redsun-gradient">Nuestros Clientes</span>
          </h2>
        </div>

        {/* Filter buttons */}
        <div className="flex justify-center gap-3">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'alcaldia', label: 'Alcaldías' },
            { id: 'asamblea', label: 'Asamblea & Concejo' },
            { id: 'senado', label: 'Senado & Gobernación' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setTestimonialFilter(btn.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                testimonialFilter === btn.id
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTestimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="redsun-card p-8 space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#FF4D4D]/40"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.name}</h4>
                    <span className="text-[10px] text-zinc-400 block">{t.role}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10">
                  {t.metric}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* SECTION 11: PRICING (PLANES Y PRECIOS) */}
      <motion.section
        id="precios"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-redsun-h2 font-black text-white">
            Planes Diseñados para <span className="text-redsun-gradient">Cada Alcance</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Elige el plan acorde al tipo de elección y tamaño de tu campaña política.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-white/5 border border-white/10 mt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition ${
                billingCycle === 'monthly' ? 'bg-[#FF4D4D] text-white shadow' : 'text-zinc-400'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-[#FF4D4D] text-white shadow' : 'text-zinc-400'
              }`}
            >
              <span>Anual</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase">
                20% Ahorro
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Card 1: Starter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="redsun-card p-8 space-y-8 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">Starter Campaign</h3>
                <p className="text-xs text-zinc-400 mt-2">Ideal para campañas locales de tamaño pequeño.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  ${billingCycle === 'annual' ? '119' : '149'}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">USD / mes</span>
              </div>

              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Hasta 10,000 votantes en CRM</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Copiloto IA (500 consultas/mes)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Monitoreo de 20 mesas E-14</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="redsun-btn-secondary w-full text-xs"
            >
              Seleccionar Starter
            </button>
          </motion.div>

          {/* Card 2: PRO AI (Highlighted) */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="redsun-card p-8 space-y-8 flex flex-col justify-between border-2 border-[#FF4D4D] relative redsun-glow-coral"
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#FF4D4D] to-[#FF7A3D] text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
              MÁS POPULAR
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">Pro AI Campaign</h3>
                <p className="text-xs text-zinc-300 mt-2">Poder total con IA ilimitada y control territorial.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  ${billingCycle === 'annual' ? '319' : '399'}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">USD / mes</span>
              </div>

              <ul className="space-y-3 text-xs text-white">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Hasta 100,000 votantes en CRM</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Copiloto IA Ilimitado</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Escrutinio OCR E-14 sin límite</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Integración de Firestore DB</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="redsun-btn-primary w-full text-xs"
            >
              Iniciar Pro AI
            </button>
          </motion.div>

          {/* Card 3: Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="redsun-card p-8 space-y-8 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">Enterprise Master</h3>
                <p className="text-xs text-zinc-400 mt-2">Para campañas de cobertura nacional y departamento completo.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  ${billingCycle === 'annual' ? '719' : '899'}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">USD / mes</span>
              </div>

              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Votantes ilimitados en CRM</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Servidor dedicado Cloud SQL</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Soporte prioritario 24/7 en vivo</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="redsun-btn-secondary w-full text-xs"
            >
              Contactar Ventas
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 12: PREGUNTAS FRECUENTES (FAQ ACCORDION) */}
      <motion.section
        id="faq"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-redsun-h2 font-black text-white">
            Preguntas <span className="text-redsun-gradient">Frecuentes</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqItems.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="rounded-2xl bg-[#111111] border border-white/10 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-[#FF4D4D] transition"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#FF4D4D] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-400 leading-relaxed animate-fade-in border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* SECTION 13: CTA FINAL HIGH IMPACT BANNER */}
      <motion.section
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="p-10 sm:p-16 rounded-[36px] bg-gradient-to-r from-[#FF4D4D] via-[#FF7A3D] to-[#FF6B81] text-white text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              ¿Listo para Llevar Tu Campaña al Siguiente Nivel con IA?
            </h2>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl mx-auto font-medium">
              Prueba RedSun BeeCampaign AI hoy mismo sin compromiso y asegura cada voto en tu territorio.
            </p>
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 rounded-full bg-white text-black font-extrabold text-sm hover:bg-zinc-100 transition shadow-xl cursor-pointer"
              >
                Agendar Demostración
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 14: FOOTER */}
      <footer className="border-t border-white/10 bg-[#050505] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF4D4D] to-[#FF7A3D] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#080808] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#FF4D4D]" />
                </div>
              </div>
              <span className="text-base font-extrabold text-white">RedSun BeeCampaign</span>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Software de Inteligencia Artificial & CRM político especializado para elecciones en Colombia.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Todos los sistemas operativos • Firestore DB Activo</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Producto</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href="#producto" className="hover:text-white transition">Copiloto IA</a></li>
              <li><a href="#producto" className="hover:text-white transition">CRM Votantes</a></li>
              <li><a href="#producto" className="hover:text-white transition">Territorio Heatmaps</a></li>
              <li><a href="#producto" className="hover:text-white transition">Operación Día D</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compañía</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href="#soluciones" className="hover:text-white transition">Sobre Nosotros</a></li>
              <li><a href="#precios" className="hover:text-white transition">Precios</a></li>
              <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              <li><a href="#demo" className="hover:text-white transition">Demostración</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Seguridad</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cumplimiento estricto con normatividad CNE y protección de datos Ley 1581.
            </p>
          </div>
        </div>

      </footer>

      {/* FULL REGISTRATION / SIGN UP MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-[#0d0d0d] border border-white/15 rounded-[32px] p-8 max-w-md w-full space-y-6 relative shadow-2xl"
            >
              <button
                onClick={() => { setIsModalOpen(false); setModalSubmitted(false); setModalError(null); }}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4D4D] to-[#FF7A3D] p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-red-900/50">
                  <div className="w-full h-full bg-[#080808] rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-[#FF4D4D]" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white">Crear Cuenta de Campaña</h3>
                <p className="text-xs text-zinc-400">
                  Accede al Panel Admin en segundos. Sin tarjeta de crédito.
                </p>
              </div>

              {modalSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <span className="text-sm font-black text-white block">¡Cuenta Creada Exitosamente!</span>
                    <p className="text-xs text-zinc-300">Tu campaña ya está registrada. Abriendo el Panel Admin...</p>
                  </div>
                  <a
                    href={registeredPanelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="redsun-btn-primary w-full text-xs py-3.5 flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Ir al Panel Admin Ahora</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              ) : (
                <form onSubmit={handleModalSubmit} className="space-y-3">
                  {modalError && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-semibold">
                      {modalError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={modalFullName}
                        onChange={(e) => setModalFullName(e.target.value)}
                        placeholder="Nombre del candidato"
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#FF4D4D] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Nombre de la Campaña *</label>
                      <input
                        type="text"
                        required
                        value={modalCampaignName}
                        onChange={(e) => setModalCampaignName(e.target.value)}
                        placeholder="Ej: Campaña Alcaldía 2027"
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#FF4D4D] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={modalEmail}
                        onChange={(e) => setModalEmail(e.target.value)}
                        placeholder="candidato@campana.co"
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#FF4D4D] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Contraseña (mín. 8 caracteres) *</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={modalPassword}
                        onChange={(e) => setModalPassword(e.target.value)}
                        placeholder="Contraseña segura"
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#FF4D4D] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Teléfono (opcional)</label>
                      <input
                        type="tel"
                        value={modalPhone}
                        onChange={(e) => setModalPhone(e.target.value)}
                        placeholder="+57 300 000 0000"
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#FF4D4D] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="redsun-btn-primary w-full text-xs py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {modalLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creando tu cuenta...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Crear Cuenta y Acceder al Panel</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-zinc-600">
                    ¿Ya tienes cuenta?{' '}
                    <a
                      href={PANEL_ADMIN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF4D4D] hover:underline font-bold"
                    >
                      Accede directamente al Panel →
                    </a>
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 rounded-2xl bg-gradient-to-r from-[#FF4D4D] via-[#FF7A3D] to-[#FF6B81] text-white shadow-2xl shadow-[#FF4D4D]/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-white/20 group cursor-pointer"
            title="Volver al inicio"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Volver Arriba</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
