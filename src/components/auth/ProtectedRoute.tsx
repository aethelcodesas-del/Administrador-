import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  onRedirectToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onRedirectToLogin,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-slate-400 font-medium animate-pulse">Cargando perfil seguro...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario logueado en Supabase, forzar redirección a login
  if (!user) {
    React.useEffect(() => {
      onRedirectToLogin();
    }, [onRedirectToLogin]);
    return null;
  }

  // Validar si el rol del usuario está permitido
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.roleId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center space-y-6 backdrop-blur-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Acceso No Autorizado</h2>
            <p className="text-sm text-slate-400">
              Tu perfil con rol de <span className="font-semibold text-rose-400">"{user.roleName}"</span> no cuenta con los permisos necesarios para visualizar esta sección.
            </p>
          </div>
          <button
            onClick={onRedirectToLogin}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-sm font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
          >
            Volver al Menú Principal
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
