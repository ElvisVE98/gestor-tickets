/**
 * Contexto de Autenticación (AuthContext)
 * Proveedor global del estado de autenticación, perfil del usuario activo,
 * métodos de inicio/cierre de sesión y sincronización en tiempo real con Supabase Auth.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { clienteSupabase } from '@/lib/supabase';
import { obtenerMiPerfilApi } from '@/api/usuarios.api';
import { PerfilUsuario } from '@/types/usuario.type';

interface ContextoAutenticacionTipo {
  usuario: PerfilUsuario | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<ContextoAutenticacionTipo | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Autenticación que envuelve la jerarquía de componentes de la aplicación.
 * Administra el ciclo de vida de la sesión y previene estados de carga redundantes al cambiar de pestaña.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  /**
   * Referencia mutable sincronizada con el estado `usuario`.
   * Decisión técnica: Previene el problema de "stale closures" dentro del listener
   * de `onAuthStateChange`, permitiendo inspeccionar el ID actual del usuario sin requerir
   * recrear la suscripción de Supabase en cada re-render.
   */
  const usuarioRef = useRef<PerfilUsuario | null>(null);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  /**
   * Carga el perfil del usuario desde el backend y gestiona posibles accesos denegados.
   * Si el backend rechaza la petición (por ejemplo, cuenta con baja lógica 403),
   * cierra la sesión de Supabase de inmediato para no mantener una sesión huérfana.
   */
  const cargarPerfil = useCallback(async (): Promise<PerfilUsuario | null> => {
    try {
      const perfil = await obtenerMiPerfilApi();
      setUsuario(perfil);
      usuarioRef.current = perfil;
      return perfil;
    } catch (error) {
      console.error('No se pudo obtener el perfil del backend o la cuenta fue rechazada:', error);
      // Si el backend rechaza la sesión, forzamos cierre de sesión en Supabase
      await clienteSupabase.auth.signOut();
      setUsuario(null);
      usuarioRef.current = null;
      return null;
    }
  }, []);

  /**
   * Suscripción a eventos de autenticación de Supabase (inicio de sesión, logout, token refresh).
   */
  useEffect(() => {
    let montado = true;

    const {
      data: { subscription },
    } = clienteSupabase.auth.onAuthStateChange(async (evento, session) => {
      if (!montado) return;

      // 1. Cierre de sesión o ausencia de sesión activa
      if (!session || evento === 'SIGNED_OUT') {
        setUsuario(null);
        usuarioRef.current = null;
        setCargando(false);
        return;
      }

      // 2. Refresco de token silencioso: no disparar estado de carga visible para evitar parpadeos
      if (evento === 'TOKEN_REFRESHED') {
        return;
      }

      // 3. Inicio de sesión o sesión inicial encontrada
      if (evento === 'INITIAL_SESSION' || evento === 'SIGNED_IN') {
        // Si el usuario ya está cargado en memoria con el mismo ID (revalidación al recuperar foco de ventana), ignorar silenciosamente
        if (usuarioRef.current?.id === session.user.id) {
          return;
        }

        // Carga inicial, nuevo login o cambio de cuenta
        setCargando(true);
        await cargarPerfil();
        if (montado) {
          setCargando(false);
        }
        return;
      }

      // 4. Otros eventos con sesión activa (ej. USER_UPDATED): recarga en segundo plano
      await cargarPerfil();
    });

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  /**
   * Autentica al usuario mediante correo y contraseña contra Supabase Auth.
   * 
   * @param correo Correo electrónico del usuario.
   * @param contrasena Contraseña del usuario.
   */
  const iniciarSesion = async (correo: string, contrasena: string): Promise<void> => {
    setCargando(true);
    try {
      const { data, error } = await clienteSupabase.auth.signInWithPassword({
        email: correo.trim().toLowerCase(),
        password: contrasena,
      });

      if (error || !data.session) {
        throw error || new Error('No se pudo iniciar sesión en Supabase Auth');
      }

      const perfil = await cargarPerfil();
      if (!perfil) {
        throw new Error('Tu cuenta no se encuentra activa o no tiene acceso al sistema');
      }
    } finally {
      setCargando(false);
    }
  };

  /**
   * Cierra la sesión activa en Supabase Auth y limpia el estado local de la aplicación.
   */
  const cerrarSesion = async (): Promise<void> => {
    setCargando(true);
    try {
      await clienteSupabase.auth.signOut();
      setUsuario(null);
      usuarioRef.current = null;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizado para consumir el contexto de autenticación en cualquier componente.
 * 
 * @returns Objeto con el usuario activo, estado de carga y métodos iniciarSesion / cerrarSesion.
 */
export function useAuth(): ContextoAutenticacionTipo {
  const contexto = useContext(AuthContext);
  if (contexto === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return contexto;
}
