import React, { useState, useRef, useEffect } from 'react';
import {
  Key,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
  LogIn,
  AlertCircle,
  CheckCircle,
  UserPlus,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { translateError } from '../utils/errorTranslator';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface LoginModalProps {
  /** Called when login succeeds */
  onLoginSuccess: (user: any) => void;
  /** Called when user presses back arrow */
  onBack?: () => void;
  /** Called when user presses X or Cancelar */
  onClose?: () => void;
}

type ModalMode = 'login' | 'register';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  onBack,
  onClose,
}) => {
  const [mode, setMode] = useState<ModalMode>('login');

  /* Login fields */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /* Register fields */
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regShowPw, setRegShowPw] = useState(false);

  /* Status */
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const lockInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Drag-to-move */
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mx: number; my: number; rx: number; ry: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  /* ── Lockout countdown ── */
  useEffect(() => {
    if (locked) {
      let secs = LOCK_SECONDS;
      setLockTimer(secs);
      lockInterval.current = setInterval(() => {
        secs -= 1;
        setLockTimer(secs);
        if (secs <= 0) {
          clearInterval(lockInterval.current!);
          setLocked(false);
          setAttempts(0);
          setErrorMsg(null);
          setLockTimer(0);
        }
      }, 1000);
    }
    return () => { if (lockInterval.current) clearInterval(lockInterval.current); };
  }, [locked]);

  /* ── Drag handlers ── */
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setPos({ x: dragStart.current.rx + dx, y: dragStart.current.ry + dy });
  };

  const handleMouseUp = () => {
    dragStart.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleDragHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, a')) return;
    const rect = modalRef.current!.getBoundingClientRect();
    dragStart.current = { mx: e.clientX, my: e.clientY, rx: rect.left, ry: rect.top };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  /* ── Login submit ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setLocked(true);
          setErrorMsg(`Demasiados intentos fallidos. Acceso bloqueado por ${LOCK_SECONDS}s.`);
        } else {
          setErrorMsg(
            translateError(
              error,
              `Acceso Denegado: Su correo no está registrado en la base de datos de la campaña. (Intento ${next}/${MAX_ATTEMPTS})`
            )
          );
        }
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMsg('¡Acceso concedido! Ingresando al panel...');
        setTimeout(() => {
          onLoginSuccess({
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
            email: data.user.email || '',
            role: 'Super Admin',
          });
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error crítico al iniciar sesión.');
      setIsLoading(false);
    }
  };

  /* ── Register submit ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword.trim(),
        options: { data: { name: regName.trim() } },
      });

      if (error) {
        setErrorMsg(translateError(error, 'Error al registrar la cuenta.'));
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMsg('¡Cuenta creada! Iniciando sesión automáticamente...');
        setTimeout(async () => {
          const { data: ld } = await supabase.auth.signInWithPassword({
            email: regEmail.trim(),
            password: regPassword.trim(),
          });
          if (ld?.user) {
            onLoginSuccess({
              id: ld.user.id,
              name: ld.user.user_metadata?.name || ld.user.email?.split('@')[0] || '',
              email: ld.user.email || '',
              role: 'Super Admin',
            });
          } else {
            setIsLoading(false);
            setMode('login');
            setSuccessMsg('Cuenta creada. Inicia sesión manualmente.');
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error crítico al registrar.');
      setIsLoading(false);
    }
  };

  const switchMode = (m: ModalMode) => {
    setMode(m);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  /* ── Dynamic position (drag) ── */
  const modalStyle: React.CSSProperties = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, transform: 'none' }
    : {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5, 8, 22, 0.82)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      {/* ── Modal Card ── */}
      <div
        ref={modalRef}
        style={modalStyle}
        className="relative w-full max-w-sm rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-900/30 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glassmorphism layer */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background:
              'linear-gradient(145deg, rgba(8,16,38,0.97) 0%, rgba(5,18,48,0.95) 100%)',
            backdropFilter: 'blur(24px)',
          }}
        />
        {/* Top edge glow */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        {/* Bottom edge glow */}
        <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl bg-gradient-to-r from-transparent via-cyan-900/30 to-transparent" />

        {/* Drag handle */}
        <div
          className="relative flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragHandleMouseDown}
        >
          <div className="h-1 w-10 rounded-full bg-slate-600/70" />
        </div>

        {/* ── Inner content ── */}
        <div className="relative px-6 pb-6 pt-2 space-y-4">

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Teal key icon */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30"
                style={{ background: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)' }}
              >
                <Key className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-[15px] font-extrabold leading-tight text-white">
                  {mode === 'login' ? (
                    <>Acceso al Gestión<br />Administrativa</>
                  ) : (
                    'Registro de Cuenta'
                  )}
                </h2>
                <p className="mt-0.5 text-[11px] font-semibold text-cyan-400">
                  Rol: Administrador / Superadmin
                </p>
              </div>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center gap-1 mt-0.5">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  title="Volver"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700/60 hover:text-white transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  title="Cerrar"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

          {/* Error alert */}
          {errorMsg && !successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <p className="text-[11.5px] font-semibold leading-snug text-rose-300">{errorMsg}</p>
            </div>
          )}

          {/* Success alert */}
          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-[11.5px] font-semibold leading-snug text-emerald-300">{successMsg}</p>
            </div>
          )}

          {/* Lockout timer */}
          {locked && (
            <p className="text-center text-[11px] font-bold text-amber-400 animate-pulse">
              Bloqueado temporalmente — reintento en {lockTimer}s…
            </p>
          )}

          {/* ═══════════════════ LOGIN FORM ═══════════════════ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Usuario / Correo Registrado
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    required
                    disabled={locked || isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@dominio.com"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 pl-9 pr-4 py-2.5 text-[12px] font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={locked || isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 pl-9 pr-10 py-2.5 text-[12px] font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-end justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-left text-[11px] font-semibold leading-snug text-cyan-400 underline underline-offset-2 hover:text-cyan-300 transition-colors"
                >
                  ¿No tienes cuenta?<br />Regístrate
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {onClose && (
                    <button
                      type="button"
                      id="modal-cancel-btn"
                      onClick={onClose}
                      className="rounded-xl border border-slate-600/60 bg-slate-800/60 px-4 py-2.5 text-[11.5px] font-bold text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    id="modal-login-btn"
                    disabled={locked || isLoading}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[11.5px] font-extrabold text-white shadow-lg shadow-cyan-700/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 60%, #155e75 100%)' }}
                  >
                    <LogIn className="h-3.5 w-3.5 shrink-0" />
                    <span className="leading-tight">
                      {isLoading ? 'Ingresando...' : <>Iniciar Sesión e<br />Ingresar →</>}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ═══════════════════ REGISTER FORM ═══════════════════ */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    disabled={isLoading}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej: Ober Osorio"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 pl-9 pr-4 py-2.5 text-[12px] font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="correo@dominio.com"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 pl-9 pr-4 py-2.5 text-[12px] font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70" />
                  <input
                    id="reg-password"
                    type={regShowPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    disabled={isLoading}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 pl-9 pr-10 py-2.5 text-[12px] font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPw(!regShowPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {regShowPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-end justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-left text-[11px] font-semibold leading-snug text-cyan-400 underline underline-offset-2 hover:text-cyan-300 transition-colors"
                >
                  ¿Ya tienes cuenta?<br />Inicia sesión
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-600/60 bg-slate-800/60 px-4 py-2.5 text-[11.5px] font-bold text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    id="modal-register-btn"
                    disabled={isLoading}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[11.5px] font-extrabold text-white shadow-lg shadow-emerald-700/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 60%, #065f46 100%)' }}
                  >
                    <UserPlus className="h-3.5 w-3.5 shrink-0" />
                    <span>{isLoading ? 'Registrando...' : 'Crear Cuenta →'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
