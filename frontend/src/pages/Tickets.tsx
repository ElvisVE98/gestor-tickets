/**
 * Página principal de listado y gestión de tickets de soporte.
 * Ofrece visualización adaptada al rol del usuario: vista simplificada con chips para solicitantes
 * y panel con KPIs métricas y filtros multidimensionales para soporte y administradores.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { obtenerMetricasTicketsApi } from '@/api/tickets.api';
import {
  TicketEntidad,
  FiltrosListarTickets,
  EstadoTicket,
  CategoriaTicket,
  PrioridadTicket,
  MetricasTicketsRespuesta,
} from '@/types/ticket.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  AlertTriangle,
  Inbox,
  Clock,
  Flame,
  RotateCw,
  Ticket as TicketIcon,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  formatearFolio,
  formatearFecha,
  NOMBRES_CATEGORIAS,
} from '@/lib/formateadores';
import { BadgeEstado } from '@/components/tickets/BadgeEstado';
import { BadgePrioridad } from '@/components/tickets/BadgePrioridad';

/**
 * Componente de página para la bandeja de tickets.
 * Orquesta la carga paginada de datos vía `useTickets`, la sincronización de filtros desde la URL,
 * la consulta de métricas globales del equipo de soporte y la navegación hacia el detalle o creación.
 */
export function Tickets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const esSolicitante = usuario?.rol === 'solicitante';

  // Estados locales para los filtros de búsqueda
  const [filtroEstado, setFiltroEstado] = useState<EstadoTicket | ''>('');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaTicket | ''>('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadTicket | ''>('');
  const [filtroAsignado, setFiltroAsignado] = useState<'asignado' | 'sin_asignar' | ''>('');
  const [textoBusqueda, setTextoBusqueda] = useState<string>('');

  // Estado para las métricas globales del panel de soporte
  const [metricas, setMetricas] = useState<MetricasTicketsRespuesta>({
    sinAsignar: 0,
    abiertos: 0,
    enProgreso: 0,
    urgentesActivos: 0,
  });

  // Cargar las métricas globales para usuarios con rol soporte o administrador
  const cargarMetricas = useCallback(async () => {
    if (esSolicitante) return;
    try {
      const datos = await obtenerMetricasTicketsApi();
      setMetricas(datos);
    } catch (err) {
      console.error('Error al cargar métricas de la mesa de ayuda:', err);
    }
  }, [esSolicitante]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  // Sincronizar filtro con query params de la URL (ej. ?asignado=sin_asignar proveniente de enlaces del Sidebar)
  const paramAsignado = searchParams.get('asignado');
  useEffect(() => {
    if (paramAsignado === 'sin_asignar' || paramAsignado === 'asignado') {
      setFiltroAsignado(paramAsignado);
    } else if (paramAsignado === null) {
      setFiltroAsignado('');
    }
  }, [paramAsignado]);

  // Construcción memoizada del objeto de parámetros para enviar a la API
  const filtrosApi: FiltrosListarTickets = useMemo(() => {
    const params: FiltrosListarTickets = {};
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroCategoria) params.categoria = filtroCategoria;
    if (filtroPrioridad) params.prioridad = filtroPrioridad;
    if (filtroAsignado) params.asignado = filtroAsignado;
    if (textoBusqueda.trim()) params.buscar = textoBusqueda.trim();
    return params;
  }, [filtroEstado, filtroCategoria, filtroPrioridad, filtroAsignado, textoBusqueda]);

  // Hook que encapsula la petición paginada, estado de carga y total de páginas
  const {
    tickets,
    cargando,
    error,
    total,
    pagina,
    limite,
    totalPaginas,
    cambiarPagina,
    recargar,
  } = useTickets(filtrosApi);

  /**
   * Restablece todos los criterios de filtrado a sus valores iniciales vacíos.
   */
  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltroCategoria('');
    setFiltroPrioridad('');
    setFiltroAsignado('');
    setTextoBusqueda('');
  };

  const hayFiltrosActivos = Boolean(
    filtroEstado || filtroCategoria || filtroPrioridad || filtroAsignado || textoBusqueda
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Encabezado de Página y Botón Crear */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {esSolicitante ? 'Mis tickets' : 'Todos los tickets'}
            </h2>
            <p className="text-sm text-slate-600">
              {esSolicitante
                ? 'Historial y estado de tus solicitudes de soporte técnico'
                : 'Bandeja general de gestión y seguimiento de tickets'}
            </p>
          </div>

          <Button
            className="bg-[#312e81] text-white shadow hover:bg-[#4338ca] self-start sm:self-auto"
            onClick={() => navigate('/tickets/nuevo')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear ticket
          </Button>
        </div>

        {/* Tarjetas de Resumen (Solo para Soporte y Administrador) */}
        {!esSolicitante && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                    Sin asignar
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">
                    {metricas.sinAsignar}
                  </p>
                </div>
                <div className="rounded-full bg-amber-100 p-2.5 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-sky-200 bg-sky-50/50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                    Abiertos
                  </p>
                  <p className="mt-1 text-2xl font-bold text-sky-900">
                    {metricas.abiertos}
                  </p>
                </div>
                <div className="rounded-full bg-sky-100 p-2.5 text-sky-700">
                  <Inbox className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50/50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
                    En progreso
                  </p>
                  <p className="mt-1 text-2xl font-bold text-indigo-900">
                    {metricas.enProgreso}
                  </p>
                </div>
                <div className="rounded-full bg-indigo-100 p-2.5 text-indigo-700">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-800">
                    Urgentes activos
                  </p>
                  <p className="mt-1 text-2xl font-bold text-red-900">
                    {metricas.urgentesActivos}
                  </p>
                </div>
                <div className="rounded-full bg-red-100 p-2.5 text-red-700">
                  <Flame className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros: Chips rápidos para solicitante vs Filtros completos para soporte */}
        {esSolicitante ? (
          /* Chips de filtro rápido para solicitante */
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Filtrar por estado:</span>
            <button
              onClick={() => setFiltroEstado('')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === ''
                  ? 'bg-[#312e81] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroEstado('abierto')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === 'abierto'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Abiertos
            </button>
            <button
              onClick={() => setFiltroEstado('en_progreso')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === 'en_progreso'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              En progreso
            </button>
            <button
              onClick={() => setFiltroEstado('resuelto')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === 'resuelto'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Resueltos
            </button>
            <button
              onClick={() => setFiltroEstado('cerrado')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === 'cerrado'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Cerrados
            </button>
          </div>
        ) : (
          /* Filtros completos para soporte y administradores */
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Buscador de texto */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar folio o título..."
                    value={textoBusqueda}
                    onChange={(e) => setTextoBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filtro Estado */}
                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as EstadoTicket | '')}
                >
                  <option value="">Todos los estados</option>
                  <option value="abierto">Abierto</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="cerrado">Cerrado</option>
                </Select>

                {/* Filtro Categoría */}
                <Select
                  value={filtroCategoria}
                  onChange={(e) =>
                    setFiltroCategoria(e.target.value as CategoriaTicket | '')
                  }
                >
                  <option value="">Todas las categorías</option>
                  <option value="erp_flexline">Flexline ERP</option>
                  <option value="rindegasto">Rindegastos</option>
                  <option value="soporte_ti">Soporte TI</option>
                  <option value="solicitud_desarrollo">Desarrollo</option>
                  <option value="otro">Otro</option>
                </Select>

                {/* Filtro Prioridad */}
                <Select
                  value={filtroPrioridad}
                  onChange={(e) =>
                    setFiltroPrioridad(e.target.value as PrioridadTicket | '')
                  }
                >
                  <option value="">Todas las prioridades</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </Select>

                {/* Filtro Asignación */}
                <Select
                  value={filtroAsignado}
                  onChange={(e) =>
                    setFiltroAsignado(
                      e.target.value as 'asignado' | 'sin_asignar' | ''
                    )
                  }
                >
                  <option value="">Todas las asignaciones</option>
                  <option value="sin_asignar">Sin asignar</option>
                  <option value="asignado">Asignados</option>
                </Select>
              </div>

              {hayFiltrosActivos && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                  <span>Filtros aplicados</span>
                  <button
                    onClick={limpiarFiltros}
                    className="font-medium text-red-600 hover:text-red-800"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estado de Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recargar()}
              className="border-red-300 text-red-800 hover:bg-red-100"
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              Reintentar
            </Button>
          </div>
        )}

        {/* Tabla de Tickets */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <RotateCw className="h-8 w-8 animate-spin text-[#312e81]" />
              <p className="mt-3 text-sm font-medium">Cargando tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            /* Estado Vacío */
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-3">
                <TicketIcon className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">
                {esSolicitante
                  ? 'Aún no tienes tickets registrados'
                  : 'No se encontraron tickets con los filtros actuales'}
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                {esSolicitante
                  ? 'Puedes crear una nueva solicitud técnica usando el botón superior.'
                  : 'Prueba a cambiar o limpiar los filtros de búsqueda.'}
              </p>
              {hayFiltrosActivos && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limpiarFiltros}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Folio</TableHead>
                    <TableHead>Título y Categoría</TableHead>
                    <TableHead className="w-[130px]">Prioridad</TableHead>
                    <TableHead className="w-[140px]">Estado</TableHead>
                    <TableHead className="w-[180px] text-right">
                      {esSolicitante ? 'Actualizado' : 'Asignado a'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: TicketEntidad) => {
                    const esSinAsignar =
                      !ticket.asignado_a_id &&
                      ticket.estado !== 'cerrado' &&
                      ticket.estado !== 'resuelto';

                    return (
                      <TableRow
                        key={ticket.id}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className={`cursor-pointer transition-colors ${
                          !esSolicitante && esSinAsignar
                            ? 'border-l-4 border-l-amber-500 bg-amber-50/20 hover:bg-amber-50/50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Folio */}
                        <TableCell className="font-mono font-semibold text-[#312e81]">
                          {formatearFolio(ticket.folio)}
                        </TableCell>

                        {/* Título y Categoría */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-900 line-clamp-1">
                              {ticket.titulo}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span>{NOMBRES_CATEGORIAS[ticket.categoria] || ticket.categoria}</span>
                              {!esSolicitante && ticket.creador?.nombre_completo && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-600 font-medium">
                                    {ticket.creador.nombre_completo}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Prioridad con color */}
                        <TableCell>
                          <BadgePrioridad prioridad={ticket.prioridad} />
                        </TableCell>

                        {/* Estado con color */}
                        <TableCell>
                          <BadgeEstado estado={ticket.estado} />
                        </TableCell>

                        {/* Última columna condicional */}
                        <TableCell className="text-right text-xs text-slate-600">
                          {esSolicitante ? (
                            <span>{formatearFecha(ticket.fecha_actualizacion)}</span>
                          ) : (
                            <span
                              className={
                                ticket.asignado_a?.nombre_completo
                                  ? 'font-medium text-slate-800'
                                  : 'font-semibold text-amber-700'
                              }
                            >
                              {ticket.asignado_a?.nombre_completo || 'Sin asignar'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Barra de Controles de Paginación */}
              {total > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    Mostrando <span className="font-semibold text-slate-700">{Math.min((pagina - 1) * limite + 1, total)}</span> a{' '}
                    <span className="font-semibold text-slate-700">{Math.min(pagina * limite, total)}</span> de{' '}
                    <span className="font-semibold text-slate-700">{total}</span> tickets
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagina <= 1 || cargando}
                      onClick={() => cambiarPagina(pagina - 1)}
                      className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Anterior
                    </Button>

                    <span className="text-xs text-slate-600 px-2 font-medium">
                      Página {pagina} de {totalPaginas}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagina >= totalPaginas || cargando}
                      onClick={() => cambiarPagina(pagina + 1)}
                      className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50"
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
    </div>
  );
}

export default Tickets;
