/**
 * Servicio de Tickets
 * Capa de lógica de negocio para el ciclo de vida de tickets, transiciones de estado,
 * asignación de agentes, auditoría de cambios y control de acceso por rol.
 */

import {
  actualizarEstadoTicket,
  asignarTicket,
  insertarHistorialTicket,
  insertarTicket,
  listarHistorialPorTicket,
  listarTickets,
  obtenerTicketPorId,
  obtenerMetricasTicketsRepository,
} from '../repositories/ticket.repository';
import { CrearTicketEntrada } from '../schemas/ticket.schema';
import {
  TicketEntidad,
  TicketParaCrear,
  EstadoTicket,
  HistorialTicketEntidad,
  FiltrosListarTickets,
  ResultadoListarTicketsPaginado,
  MetricasTicketsRespuesta,
} from '../types/ticket.type';
import { RolUsuario } from '../types/usuario.type';
import { ErrorApp, ErrorNoEncontrado } from '../errors/app.error';

/**
 * Ejecuta la creación de un nuevo ticket en el sistema.
 * Establece el estado inicial obligatorio en 'abierto' y deja la asignación inicial en `null`.
 * 
 * @param datosTicket Datos validados del ticket (título, descripción, categoría, prioridad).
 * @param idCreador Identificador UUID del usuario autenticado que emite el ticket.
 * @returns Promesa con el ticket creado y sus relaciones cargadas.
 */
export const crearTicketServicio = async (
  datosTicket: CrearTicketEntrada,
  idCreador: string
): Promise<TicketEntidad> => {
  // Construcción del objeto completo con el creador autenticado y estado inicial 'abierto'
  const nuevoTicket: TicketParaCrear = {
    titulo: datosTicket.titulo,
    descripcion: datosTicket.descripcion,
    categoria: datosTicket.categoria,
    prioridad: datosTicket.prioridad,
    estado: 'abierto',
    creador_id: idCreador,
    asignado_a_id: null,
  };

  return await insertarTicket(nuevoTicket);
};

/**
 * Obtiene el listado paginado de tickets respetando las reglas de visibilidad del rol y filtros aplicados.
 * 
 * @param idUsuario Identificador UUID del usuario solicitante.
 * @param rol Rol del usuario autenticado ('solicitante' | 'soporte' | 'administrador').
 * @param filtros Criterios opcionales de búsqueda, filtrado y paginación (pagina, limite).
 * @returns Promesa con el resultado paginado de tickets y metadatos de conteo.
 */
export const listarTicketsServicio = async (
  idUsuario: string,
  rol: RolUsuario,
  filtros?: FiltrosListarTickets
): Promise<ResultadoListarTicketsPaginado> => {
  return await listarTickets(idUsuario, rol, filtros);
};

/**
 * Obtiene el resumen de métricas/KPIs globales de la mesa de ayuda para soporte y administradores.
 * 
 * @returns Promesa con los conteos de tickets sin asignar, abiertos, en progreso y urgentes activos.
 */
export const obtenerMetricasTicketsServicio = async (): Promise<MetricasTicketsRespuesta> => {
  return await obtenerMetricasTicketsRepository();
};

/**
 * Obtiene el detalle completo de un ticket específico validando la visibilidad del usuario.
 * 
 * Decisión de seguridad: Si un 'solicitante' intenta consultar un ticket ajeno existente,
 * se retorna `ErrorNoEncontrado` en lugar de `ErrorProhibido` para evitar enumeración y revelación de recursos.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idUsuario Identificador UUID del usuario consultante.
 * @param rol Rol del usuario autenticado.
 * @returns Promesa con la entidad del ticket.
 */
export const obtenerTicketPorIdServicio = async (
  idTicket: string,
  idUsuario: string,
  rol: RolUsuario
): Promise<TicketEntidad> => {
  const ticket = await obtenerTicketPorId(idTicket);

  // 1. Si no existe el ticket en la base de datos
  if (!ticket) {
    throw new ErrorNoEncontrado('Ticket no encontrado');
  }

  // 2. Si el rol es solicitante y el ticket no fue creado por él
  if (rol === 'solicitante' && ticket.creador_id !== idUsuario) {
    throw new ErrorNoEncontrado('Ticket no encontrado');
  }

  return ticket;
};

/**
 * Modifica el estado de un ticket y registra de forma atómica la auditoría en 'historial_ticket'.
 * 
 * Flujo y decisiones de diseño:
 * 1. Verifica la existencia del ticket.
 * 2. Si el estado nuevo es idéntico al actual, rechaza la operación para no ensuciar la auditoría.
 * 3. Si el estado cambia a 'cerrado', genera la marca de tiempo `fecha_cierre`; si se reabre, la limpia con `null`.
 * 4. Actualiza el ticket en la base de datos.
 * 5. Registra el evento en el historial. Si este paso falla, ejecuta una compensación manual (rollback)
 *    restituyendo el ticket a su estado previo para asegurar consistencia e integridad en la auditoría.
 * 
 * @param idTicket Identificador UUID del ticket a modificar.
 * @param estadoNuevo Nuevo estado solicitado ('abierto', 'en_progreso', 'resuelto', 'cerrado').
 * @param idUsuarioQueModifica UUID del usuario que efectúa el cambio.
 * @returns Promesa con el ticket en su nuevo estado.
 */
export const cambiarEstadoTicketServicio = async (
  idTicket: string,
  estadoNuevo: EstadoTicket,
  idUsuarioQueModifica: string
): Promise<TicketEntidad> => {
  // 1. Obtener el ticket actual para conocer su estado previo
  const ticketActual = await obtenerTicketPorId(idTicket);

  if (!ticketActual) {
    throw new ErrorNoEncontrado('Ticket no encontrado');
  }

  // 2. Si el estado nuevo es idéntico al actual, no requiere cambio ni auditoría
  if (ticketActual.estado === estadoNuevo) {
    throw new ErrorApp('El ticket ya se encuentra en el estado indicado', 400);
  }

  const estadoAnterior = ticketActual.estado;
  const fechaCierreAnterior = ticketActual.fecha_cierre;

  // 3. Determinar fecha de cierre (solo si pasa a 'cerrado')
  const fechaCierreNueva = estadoNuevo === 'cerrado' ? new Date().toISOString() : null;

  // 4. Actualizar el ticket en la base de datos
  const ticketActualizado = await actualizarEstadoTicket(
    idTicket,
    estadoNuevo,
    fechaCierreNueva
  );

  // 5. Insertar auditoría en historial_ticket con patrón de compensación (rollback manual)
  try {
    await insertarHistorialTicket({
      ticket_id: idTicket,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      modificado_por_id: idUsuarioQueModifica,
    });
  } catch (errorHistorial) {
    // Si la inserción del historial falla, revertimos el ticket a su estado previo
    await actualizarEstadoTicket(idTicket, estadoAnterior, fechaCierreAnterior);
    throw new Error(
      `Fallo al registrar la auditoría de estado. Se revirtió el cambio del ticket: ${(errorHistorial as Error).message}`
    );
  }

  return ticketActualizado;
};

/**
 * Asigna o desasigna un agente responsable para la resolución del ticket.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idNuevoAsignado UUID del agente de soporte/administrador o `null` para desasignar.
 * @returns Promesa con el ticket actualizado.
 */
export const asignarTicketServicio = async (
  idTicket: string,
  idNuevoAsignado: string | null
): Promise<TicketEntidad> => {
  // 1. Validar que el ticket exista
  const ticket = await obtenerTicketPorId(idTicket);

  if (!ticket) {
    throw new ErrorNoEncontrado('Ticket no encontrado');
  }

  // 2. Actualizar el campo asignado_a_id en la base de datos
  return await asignarTicket(idTicket, idNuevoAsignado);
};

/**
 * Obtiene el historial cronológico de cambios de estado de un ticket, previa verificación de visibilidad.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idUsuario Identificador del usuario consultante.
 * @param rol Rol del usuario autenticado.
 * @returns Promesa con el listado de eventos del historial.
 */
export const listarHistorialTicketServicio = async (
  idTicket: string,
  idUsuario: string,
  rol: RolUsuario
): Promise<HistorialTicketEntidad[]> => {
  // 1. Validar que el ticket exista y que el usuario tenga acceso (reutilización DRY)
  await obtenerTicketPorIdServicio(idTicket, idUsuario, rol);

  // 2. Obtener y retornar el historial ordenado cronológicamente
  return await listarHistorialPorTicket(idTicket);
};
