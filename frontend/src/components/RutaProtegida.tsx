/**
 * Componente Guardián: RutaProtegida
 * Intercepta el acceso a rutas privadas, validando sesión activa y control de acceso basado en roles (RBAC).
 */

import { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RolUsuario } from '@/types/usuario.type';
import { Loader2 } from 'lucide-react';

interface RutaProtegidaProps {
  rolesPermitidos?: RolUsuario[];
  children?: ReactNode;
}

/**
 * Renderiza el contenido protegido si el usuario cumple con los requisitos de sesión y rol,
 * o redirige en caso contrario.
 * 
 * @param rolesPermitidos Lista opcional de roles autorizados para la ruta.
 * @param children Elementos hijos o `Outlet` de React Router por defecto.
 */
export function RutaProtegida({ rolesPermitidos, children }: RutaProtegidaProps) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  // 1. Mientras se verifica la sesión inicial, mostrar spinner de carga
  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2b5c]" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Verificando sesión...
        </p>
      </div>
    );
  }

  // 2. Si no hay usuario autenticado, redirigir a /login guardando la ruta previa
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Si se especificaron roles y el rol del usuario no tiene permiso, redirigir a /tickets
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return (
      <Navigate
        to="/tickets"
        replace
        state={{
          sinPermiso: true,
          mensaje: 'No tienes los permisos necesarios para acceder a esta sección.',
        }}
      />
    );
  }

  // 4. Si todo es válido, renderizar los componentes hijos o el Outlet de React Router
  return children ? <>{children}</> : <Outlet />;
}

export default RutaProtegida;
