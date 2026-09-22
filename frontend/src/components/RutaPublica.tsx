/**
 * Componente Guardián: RutaPublica
 * Permite el acceso únicamente a usuarios no autenticados (ej. vista de Login).
 * Si detecta una sesión existente activa, redirige automáticamente hacia `/tickets`.
 */

import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RutaPublicaProps {
  children?: ReactNode;
}

/**
 * Renderiza la vista pública si no hay sesión activa, o redirige a `/tickets` si el usuario ya está autenticado.
 * 
 * @param children Elementos hijos o `Outlet` por defecto.
 */
export function RutaPublica({ children }: RutaPublicaProps) {
  const { usuario, cargando } = useAuth();

  // 1. Mientras se verifica la sesión, mostrar estado de carga
  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2b5c]" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Cargando...
        </p>
      </div>
    );
  }

  // 2. Si ya hay una sesión activa, redirigir a /tickets
  if (usuario) {
    return <Navigate to="/tickets" replace />;
  }

  // 3. Si no hay sesión, permitir acceso al componente público (ej. Login)
  return children ? <>{children}</> : <Outlet />;
}

export default RutaPublica;
