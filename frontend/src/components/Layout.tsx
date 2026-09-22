/**
 * Componente Estructural: Layout
 * Estructura visual compartida que contiene el Sidebar de navegación corporativo,
 * información del usuario activo, selector dinámico de opciones según rol y contenedor de páginas.
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Ticket as TicketIcon,
  AlertTriangle,
  Users,
  LogOut,
  Layers,
} from 'lucide-react';

/**
 * Layout principal con barra lateral persistente y área de contenido anidado (`Outlet`).
 */
export function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();

  const esSolicitante = usuario?.rol === 'solicitante';
  const esSoporteOAdmin = usuario?.rol === 'soporte' || usuario?.rol === 'administrador';
  const esAdmin = usuario?.rol === 'administrador';

  // Determinación de enlace activo en el menú de navegación
  const esRutaSinAsignar =
    location.pathname === '/tickets' &&
    location.search.includes('asignado=sin_asignar');

  const esRutaTodosTickets =
    (location.pathname === '/tickets' || location.pathname.startsWith('/tickets/')) &&
    !esRutaSinAsignar;

  const esRutaUsuarios = location.pathname.startsWith('/usuarios');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar fijo a la izquierda */}
      <aside className="w-64 shrink-0 bg-[#312e81] text-white flex flex-col justify-between shadow-xl">
        {/* Cabecera del Sidebar */}
        <div>
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#312e81] font-black text-xl shadow-md">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                Resolva
              </h1>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Mesa de ayuda
              </p>
            </div>
          </div>

          {/* Menú de Navegación por Secciones y Roles */}
          <nav className="p-4 space-y-6">
            {/* Sección SOPORTE (Visible para Soporte y Administrador) */}
            {esSoporteOAdmin && (
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Soporte
                </p>

                <Link
                  to="/tickets"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    esRutaTodosTickets
                      ? 'bg-white/15 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>Todos los tickets</span>
                </Link>

                <Link
                  to="/tickets?asignado=sin_asignar"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    esRutaSinAsignar
                      ? 'bg-white/15 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Sin asignar</span>
                </Link>
              </div>
            )}

            {/* Sección SOLICITANTE (Visible para Solicitantes) */}
            {esSolicitante && (
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Solicitante
                </p>

                <Link
                  to="/tickets"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    esRutaTodosTickets
                      ? 'bg-white/15 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <TicketIcon className="h-4 w-4 shrink-0" />
                  <span>Mis tickets</span>
                </Link>
              </div>
            )}

            {/* Sección ADMINISTRACIÓN (Visible exclusivamente para Administradores) */}
            {esAdmin && (
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Administración
                </p>

                <Link
                  to="/usuarios"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    esRutaUsuarios
                      ? 'bg-white/15 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Usuarios</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Pie del Sidebar con Información del Perfil y Botón de Cerrar Sesión */}
        <div className="p-4 border-t border-white/10 bg-[#1e1b4b]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {usuario?.nombre_completo.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {usuario?.nombre_completo}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {usuario?.rol}
                </p>
              </div>
            </div>

            <button
              onClick={cerrarSesion}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Área de Contenido Principal (Outlet) */}
      <div className="flex-1 min-h-screen overflow-y-auto bg-slate-50">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
