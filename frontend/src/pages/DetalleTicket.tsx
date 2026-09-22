/**
 * Página de visualización y gestión integral de un ticket específico.
 * Orquesta la composición de subcomponentes especializados: descripción, hilo de comentarios,
 * panel de reasignación/estado, subida/descarga de adjuntos y línea de tiempo de historial.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDetalleTicket } from '@/hooks/useDetalleTicket';
import {
  formatearFolio,
  formatearFecha,
  NOMBRES_CATEGORIAS,
  NOMBRES_ESTADOS,
  NOMBRES_PRIORIDADES,
} from '@/lib/formateadores';
import { BadgeEstado } from '@/components/tickets/BadgeEstado';
import { BadgePrioridad } from '@/components/tickets/BadgePrioridad';
import { HiloComentarios } from '@/components/tickets/HiloComentarios';
import { PanelGestionTicket } from '@/components/tickets/PanelGestionTicket';
import { PanelAdjuntosTicket } from '@/components/tickets/PanelAdjuntosTicket';
import { PanelHistorialTicket } from '@/components/tickets/PanelHistorialTicket';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, RotateCw, AlertCircle } from 'lucide-react';

/**
 * Componente principal para el detalle de un ticket.
 * Obtiene el ID desde los parámetros de la URL y utiliza `useDetalleTicket` para alimentar
 * de forma reactiva cada sección, permitiendo recargas parciales y eficientes ante mutaciones.
 */
export function DetalleTicket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esGestionable =
    usuario?.rol === 'soporte' || usuario?.rol === 'administrador';

  // Hook que administra la carga en paralelo de ticket, comentarios, adjuntos e historial
  const {
    ticket,
    comentarios,
    adjuntos,
    historial,
    cargando,
    error,
    recargarTodo,
    recargarTicket,
    recargarComentarios,
    recargarAdjuntos,
    recargarHistorial,
  } = useDetalleTicket(id);

  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <RotateCw className="h-8 w-8 animate-spin text-[#312e81]" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Cargando detalle del ticket...
        </p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-red-200 bg-white p-6 text-center shadow-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            {error || 'Ticket no encontrado'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Es posible que el ticket haya sido eliminado o no tengas permisos para acceder a él.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/tickets')}>
              Volver a la lista
            </Button>
            <Button
              onClick={() => recargarTodo()}
              className="bg-[#312e81] text-white"
            >
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Encabezado Superior con Navegación y Badges */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/tickets"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#312e81] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a tickets
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className="font-mono text-base font-bold text-[#312e81]">
              {formatearFolio(ticket.folio)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BadgePrioridad prioridad={ticket.prioridad} />
            <BadgeEstado estado={ticket.estado} />
          </div>
        </div>
      </header>

      {/* Contenido Principal en 2 Columnas */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna Izquierda: Descripción + Comentarios */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {NOMBRES_CATEGORIAS[ticket.categoria] || ticket.categoria}
                  </span>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {ticket.titulo}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {ticket.creador?.nombre_completo
                      ? `${ticket.creador.nombre_completo} abrió este ticket · `
                      : 'Abierto el '}
                    {formatearFecha(ticket.fecha_creacion)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed">
                  {ticket.descripcion}
                </div>
              </CardContent>
            </Card>

            <HiloComentarios
              ticketId={ticket.id}
              comentarios={comentarios}
              onComentarioEnviado={recargarComentarios}
            />
          </div>

          {/* Columna Derecha: Paneles Laterales */}
          <div className="space-y-6">
            {esGestionable && (
              <PanelGestionTicket
                ticket={ticket}
                onActualizado={async () => {
                  await Promise.all([recargarTicket(), recargarHistorial()]);
                }}
              />
            )}

            {/* Panel Detalle del ticket */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Detalle del ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Categoría:</span>
                  <span className="font-medium text-slate-800">
                    {NOMBRES_CATEGORIAS[ticket.categoria] || ticket.categoria}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Prioridad:</span>
                  <span className="font-medium text-slate-800">
                    {NOMBRES_PRIORIDADES[ticket.prioridad] || ticket.prioridad}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Estado:</span>
                  <span className="font-medium text-slate-800">
                    {NOMBRES_ESTADOS[ticket.estado] || ticket.estado}
                  </span>
                </div>

                {ticket.creador?.nombre_completo && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Solicitante:</span>
                    <span className="font-medium text-slate-800">
                      {ticket.creador.nombre_completo}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Asignado a:</span>
                  <span className="font-medium text-slate-800">
                    {ticket.asignado_a_id ? (
                      ticket.asignado_a?.nombre_completo || 'Técnico asignado'
                    ) : (
                      <span className="text-amber-700 font-semibold">
                        Sin asignar
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Creado el:</span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {formatearFecha(ticket.fecha_creacion)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Actualizado el:</span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {formatearFecha(ticket.fecha_actualizacion)}
                  </span>
                </div>

                {ticket.fecha_cierre && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Cerrado el:</span>
                    <span className="text-slate-700 font-mono text-[11px]">
                      {formatearFecha(ticket.fecha_cierre)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <PanelAdjuntosTicket
              ticketId={ticket.id}
              adjuntos={adjuntos}
              onAdjuntoSubido={recargarAdjuntos}
            />

            <PanelHistorialTicket historial={historial} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default DetalleTicket;
