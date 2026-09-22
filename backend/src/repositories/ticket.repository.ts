/**
 * Repositorio de Tickets
 * Capa de acceso a datos que gestiona las operaciones sobre las tablas 'tickets' e 'historial_ticket' en Supabase.
 */

import { clienteSupabase } from '../config/supabase';
import {
  FiltrosListarTickets,
  HistorialParaCrear,
  HistorialTicketEntidad,
  TicketEntidad,
  TicketParaCrear,
  EstadoTicket,
  ResultadoListarTicketsPaginado,
  MetricasTicketsRespuesta,
} from '../types/ticket.type';
import { RolUsuario } from '../types/usuario.type';

/**
 * Selector estándar para consultas de tickets.
 * Realiza un join explícito con la tabla 'usuarios' a través de las claves foráneas
 * 'creador_id' y 'asignado_a_id' para obtener el nombre del solicitante y del agente asignado.
 */
const SELECT_TICKET_CON_ASIGNADO =
  '*, creador:usuarios!creador_id(id, nombre_completo), asignado_a:usuarios!asignado_a_id(id, nombre_completo)';

/**
 * Aplica filtros de búsqueda textual o numérica a la consulta de PostgREST.
 * Si el texto ingresado es puramente numérico, busca coincidencias por número de folio exacto o título parcial.
 * Si es texto, sanitiza caracteres reservados de PostgREST (',', '(', ')') y busca por coincidencia insensible a mayúsculas en el título.
 * 
 * @param consulta Objeto de consulta en construcción de Supabase.
 * @param textoBusqueda Cadena de texto ingresada por el usuario.
 * @returns Consulta de Supabase con los filtros aplicados.
 */
const aplicarFiltroBusqueda = (consulta: any, textoBusqueda: string) => {
  const textoLimpio = textoBusqueda.trim();
  const esNumero = /^\d+$/.test(textoLimpio);

  if (esNumero) {
    const folioNum = parseInt(textoLimpio, 10);
    return consulta.or(`titulo.ilike.%${textoLimpio}%,folio.eq.${folioNum}`);
  }

  const textoSeguro = textoLimpio.replace(/[,()]/g, '');
  return consulta.ilike('titulo', `%${textoSeguro}%`);
};

/**
 * Inserta un nuevo registro de ticket en la tabla 'tickets' y recupera el registro creado
 * con las relaciones de creador y asignado resueltas.
 * 
 * @param ticket Datos del ticket a registrar (título, descripción, prioridad, categoría, creador).
 * @returns Promesa con la entidad del ticket creado.
 */
export const insertarTicket = async (ticket: TicketParaCrear): Promise<TicketEntidad> => {
  const { data, error } = await clienteSupabase
    .from('tickets')
    .insert(ticket)
    .select(SELECT_TICKET_CON_ASIGNADO)
    .single();

  if (error || !data) {
    throw new Error(
      `Error al insertar el ticket en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as TicketEntidad;
};

/**
 * Consulta la lista paginada de tickets aplicando control de visibilidad por rol y filtros combinables.
 * 
 * Regla de negocio:
 * - Los usuarios con rol 'solicitante' únicamente pueden listar sus propios tickets creados.
 * - Los usuarios con rol 'soporte' o 'administrador' tienen visibilidad global de todos los tickets.
 * 
 * @param idUsuario Identificador del usuario que realiza la consulta.
 * @param rol Rol del usuario autenticado ('solicitante' | 'soporte' | 'administrador').
 * @param filtros Criterios opcionales de filtrado y parámetros de paginación (pagina, limite).
 * @returns Promesa con la entidad paginada (tickets de la página, total de registros, página actual y páginas totales).
 */
export const listarTickets = async (
  idUsuario: string,
  rol: RolUsuario,
  filtros?: FiltrosListarTickets
): Promise<ResultadoListarTicketsPaginado> => {
  const pagina = filtros?.pagina && filtros.pagina > 0 ? filtros.pagina : 1;
  const limite = filtros?.limite && filtros.limite > 0 ? filtros.limite : 20;
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  let consulta = clienteSupabase
    .from('tickets')
    .select(SELECT_TICKET_CON_ASIGNADO, { count: 'exact' })
    .order('fecha_creacion', { ascending: false })
    .range(desde, hasta);

  // 1. Control de visibilidad por rol: solicitante solo ve sus propios tickets
  if (rol === 'solicitante') {
    consulta = consulta.eq('creador_id', idUsuario);
  }

  // 2. Aplicación de filtros opcionales combinables
  if (filtros) {
    if (filtros.estado) {
      consulta = consulta.eq('estado', filtros.estado);
    }

    if (filtros.categoria) {
      consulta = consulta.eq('categoria', filtros.categoria);
    }

    if (filtros.prioridad) {
      consulta = consulta.eq('prioridad', filtros.prioridad);
    }

    if (filtros.asignado === 'sin_asignar') {
      consulta = consulta.is('asignado_a_id', null);
    } else if (filtros.asignado === 'asignado') {
      consulta = consulta.not('asignado_a_id', 'is', null);
    }

    if (filtros.buscar && filtros.buscar.trim()) {
      consulta = aplicarFiltroBusqueda(consulta, filtros.buscar);
    }
  }

  const { data, count, error } = await consulta;

  if (error) {
    throw new Error(`Error al listar los tickets de la base de datos: ${error.message}`);
  }

  const total = count || 0;
  const total_paginas = Math.ceil(total / limite);

  return {
    tickets: (data || []) as TicketEntidad[],
    total,
    pagina,
    limite,
    total_paginas,
  };
};

/**
 * Consulta de forma ultrarrápida los 4 conteos globales de métricas/KPIs del panel de soporte.
 * Utiliza `{ count: 'exact', head: true }` para devolver únicamente los conteos sin transferir registros.
 * 
 * @returns Promesa con los 4 indicadores numéricos de la mesa de ayuda.
 */
export const obtenerMetricasTicketsRepository = async (): Promise<MetricasTicketsRespuesta> => {
  // Ejecutar las 4 consultas en paralelo con consultas head
  const [resSinAsignar, resAbiertos, resEnProgreso, resUrgentes] = await Promise.all([
    // 1. Sin asignar y no resueltos/cerrados
    clienteSupabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .is('asignado_a_id', null)
      .not('estado', 'in', '("cerrado","resuelto")'),

    // 2. Abiertos
    clienteSupabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'abierto'),

    // 3. En progreso
    clienteSupabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'en_progreso'),

    // 4. Urgentes activos (abiertos o en progreso)
    clienteSupabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('prioridad', 'urgente')
      .in('estado', ['abierto', 'en_progreso']),
  ]);

  return {
    sinAsignar: resSinAsignar.count || 0,
    abiertos: resAbiertos.count || 0,
    enProgreso: resEnProgreso.count || 0,
    urgentesActivos: resUrgentes.count || 0,
  };
};

/**
 * Consulta un ticket específico por su identificador UUID.
 * 
 * Decisión técnica: Se utiliza `.maybeSingle()` para devolver `null` limpiamente
 * cuando el ticket no existe en lugar de disparar una excepción no controlada.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con el ticket encontrado y sus relaciones resueltas, o `null` si no existe.
 */
export const obtenerTicketPorId = async (idTicket: string): Promise<TicketEntidad | null> => {
  const { data, error } = await clienteSupabase
    .from('tickets')
    .select(SELECT_TICKET_CON_ASIGNADO)
    .eq('id', idTicket)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al consultar el ticket en la base de datos: ${error.message}`);
  }

  return data as TicketEntidad | null;
};

/**
 * Actualiza el estado actual de un ticket y su fecha de cierre si corresponde.
 * 
 * @param idTicket Identificador UUID del ticket a actualizar.
 * @param estado Nuevo estado que adoptará el ticket ('abierto', 'en_progreso', 'resuelto', 'cerrado').
 * @param fechaCierre Fecha ISO de cierre o `null` si el ticket se reabre.
 * @returns Promesa con la entidad del ticket actualizada.
 */
export const actualizarEstadoTicket = async (
  idTicket: string,
  estado: EstadoTicket,
  fechaCierre: string | null
): Promise<TicketEntidad> => {
  const { data, error } = await clienteSupabase
    .from('tickets')
    .update({
      estado,
      fecha_cierre: fechaCierre,
    })
    .eq('id', idTicket)
    .select(SELECT_TICKET_CON_ASIGNADO)
    .single();

  if (error || !data) {
    throw new Error(
      `Error al actualizar el estado del ticket en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as TicketEntidad;
};

/**
 * Modifica el agente asignado a un ticket específico.
 * Permite tanto asignar un nuevo responsable (pasando su UUID) como desasignar (pasando `null`).
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idNuevoAsignado UUID del agente de soporte/administrador o `null` para desasignar.
 * @returns Promesa con el ticket actualizado.
 */
export const asignarTicket = async (
  idTicket: string,
  idNuevoAsignado: string | null
): Promise<TicketEntidad> => {
  const { data, error } = await clienteSupabase
    .from('tickets')
    .update({
      asignado_a_id: idNuevoAsignado,
    })
    .eq('id', idTicket)
    .select(SELECT_TICKET_CON_ASIGNADO)
    .single();

  if (error || !data) {
    throw new Error(
      `Error al actualizar la asignación del ticket en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as TicketEntidad;
};

/**
 * Inserta un nuevo registro de auditoría en la tabla 'historial_ticket' para documentar
 * transiciones de estado, quién realizó el cambio y observaciones opcionales.
 * 
 * @param datosHistorial Objeto con los datos de auditoría (ticket_id, usuario_id, estado_anterior, estado_nuevo, notas).
 * @returns Promesa vacía al completar la inserción.
 */
export const insertarHistorialTicket = async (
  datosHistorial: HistorialParaCrear
): Promise<void> => {
  const { error } = await clienteSupabase
    .from('historial_ticket')
    .insert(datosHistorial);

  if (error) {
    throw new Error(
      `Error al insertar el registro de historial en la base de datos: ${error.message}`
    );
  }
};

/**
 * Consulta la línea de tiempo completa de cambios de estado que ha experimentado un ticket.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con el historial ordenado cronológicamente de forma ascendente.
 */
export const listarHistorialPorTicket = async (
  idTicket: string
): Promise<HistorialTicketEntidad[]> => {
  const { data, error } = await clienteSupabase
    .from('historial_ticket')
    .select('*')
    .eq('ticket_id', idTicket)
    .order('fecha_cambio', { ascending: true });

  if (error) {
    throw new Error(
      `Error al listar el historial del ticket de la base de datos: ${error.message}`
    );
  }

  return (data || []) as HistorialTicketEntidad[];
};
