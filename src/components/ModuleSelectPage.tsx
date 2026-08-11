import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Brain,
  MapPin,
  ArrowLeft,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface ModuleSelectPageProps {
  onBack: () => void;
}

const modules = [
  {
    id: 'admin',
    icon: ShieldCheck,
    gradient: 'from-[#FF4D4D] via-[#FF7A3D] to-[#FF6B81]',
    glow: 'shadow-red-600/40',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-300',
    title: 'Gestión Administrativa Global',
    description:
      'Control total de usuarios, campañas, reportes y configuración avanzada del sistema.',
    tag: 'Administrador',
  },
  {
    id: 'strategic',
    icon: Brain,
    gradient: 'from-[#6366F1] via-[#8B5CF6] to-[#A78BFA]',
    glow: 'shadow-violet-600/40',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300',
    title: 'Gestión Estratégica & IA',
    description:
      'Análisis inteligente, toma de decisiones con IA y planificación estratégica de campaña.',
    tag: 'Estratégico',
  },
  {
    id: 'territorial',
    icon: MapPin,
    gradient: 'from-[#10B981] via-[#059669] to-[#34D399]',
    glow: 'shadow-emerald-600/40',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300',
    title: 'Gestión Territorial & E-14',
    description:
      'Coordinación de territorios, seguimiento de estructura y gestión de formularios E-14.',
    tag: 'Territorial',
  },
];

export function ModuleSelectPage({ onBack }: ModuleSelectPageProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-[90px] opacity-60" />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-violet-600/10 rounded-full blur-[100px] opacity-50" />
        <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] bg-emerald-600/10 rounded-full blur-[90px] opacity-50" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center gap-10">

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4D4D] to-[#FF7A3D] p-0.5 flex items-center justify-center shadow-xl shadow-red-950/60">
            <div className="w-full h-full bg-[#080808] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#FF4D4D]" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
              Campaña Ganadora AI
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Seleccione el Módulo
            </h1>
            <p className="text-zinc-400 text-base mt-2 max-w-md mx-auto">
              al que desea Ingresar
            </p>
          </div>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isHovered = hovered === mod.id;
            return (
              <div
                key={mod.id}
                onMouseEnter={() => setHovered(mod.id)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  relative group cursor-pointer rounded-2xl border p-6 flex flex-col gap-4
                  bg-white/[0.03] backdrop-blur-sm transition-all duration-300
                  ${mod.border}
                  ${isHovered ? `shadow-xl ${mod.glow} -translate-y-1 bg-white/[0.06]` : ''}
                `}
              >
                {/* Glow overlay on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none`}
                />

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} p-0.5 shadow-lg ${isHovered ? `shadow-${mod.glow}` : ''}`}>
                  <div className="w-full h-full bg-[#0a0a0a] rounded-[10px] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Badge */}
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full w-fit ${mod.badge}`}>
                  {mod.tag}
                </span>

                {/* Text */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <h2 className="text-white font-extrabold text-base leading-snug">
                    {mod.title}
                  </h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* Enter button */}
                <button
                  type="button"
                  className={`
                    mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r ${mod.gradient}
                    text-white font-bold text-sm flex items-center justify-center gap-2
                    opacity-80 group-hover:opacity-100 transition-all duration-200
                    hover:brightness-110 active:scale-[0.98]
                  `}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acceder al Módulo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-zinc-600 text-xs text-center">
          Acceso restringido · Solo usuarios autorizados · © 2025 Campaña Ganadora AI
        </p>
      </div>
    </div>
  );
}
