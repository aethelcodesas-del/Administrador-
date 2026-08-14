import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Obtener el perfil del usuario logueado actualmente
    const checkUser = async () => {
      try {
        const profile = await authService.getCurrentUser();
        if (mounted) {
          setUser(profile);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al recuperar el perfil del usuario activo:', err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkUser();

    // Suscribirse a cambios de estado de autenticación de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const profile = await authService.getProfileByAuthId(session.user.id);
          if (mounted) setUser(profile);
        } catch (e) {
          console.error('Error al actualizar perfil en onAuthStateChange:', e);
        }
      } else {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    signIn: authService.signIn.bind(authService),
    signOut: authService.signOut.bind(authService),
  };
}
