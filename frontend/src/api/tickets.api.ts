/**
 * Cliente de API: Módulo de Tickets
 * Funciones asíncronas para interactuar con los endpoints REST de tickets, comentarios,
 * transiciones de estado, asignaciones, historial de auditoría y archivos adjuntos.
 */

import { clienteAxios } from './axios.config';
import { RespuestaApi } from '@/types/usuario.type';
import {
  TicketEntidad,
  CrearTicketDatos,
  FiltrosListarTickets,
  EstadoTicket,
  ComentarioEntidad,
  HistorialTicketEntidad,
  AdjuntoEntidad,
  DescargaAdjuntoRespuesta,
  TicketsPaginadosRespuesta,
  MetricasTicketsRespuesta,
} from '@/types/ticket.type';

/**
 * Consulta la lista paginada de tickets aplicando filtros opcionales de estado, prioridad, categoría y búsqueda.
 * Endpoint: GET /api/tickets
 * 
 * @param filtros Criterios opcionales de filtrado y parámetros de paginación (pagina, limite).
 * @returns Promesa con el listado paginado y los totales de registros.
 */
export const listarTicketsApi = async (
  filtros?: FiltrosListarTickets
): Promise<TicketsPaginadosRespuesta> => {
  const respuesta = await clienteAxios.get<RespuestaApi<TicketsPaginadosRespuesta>>('/tickets', {
    params: filtros,
  });
  return respuesta.data.datos;
};

/**
 * Obtiene el resumen de métricas e indicadores clave de la mesa de ayuda (para soporte y administradores).
 * Endpoint: GET /api/tickets/metricas
 * 
 * @returns Promesa con los conteos de sin asignar, abiertos, en progreso y urgentes activos.
 */
export const obtenerMetricasTicketsApi = async (): Promise<MetricasTicketsRespuesta> => {
  const respuesta = await clienteAxios.get<RespuestaApi<MetricasTicketsRespuesta>>(
    '/tickets/metricas'
  );
  return respuesta.data.datos;
};

/**
 * Obtiene el detalle completo de un ticket específico mediante su identificador UUID.
 * Endpoint: GET /api/tickets/:id
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con la entidad del ticket.
 */
export const obtenerTicketPorIdApi = async (
  idTicket: string
): Promise<TicketEntidad> => {
  const respuesta = await clienteAxios.get<RespuestaApi<TicketEntidad>>(
    `/tickets/${idTicket}`
  );
  return respuesta.data.datos;
};

/**
 * Emite un nuevo ticket en el sistema.
 * Endpoint: POST /api/tickets
 * 
 * @param datos Carga útil con título, descripción, categoría y prioridad.
 * @returns Promesa con el ticket creado.
 */
export const crearTicketApi = async (
  datos: CrearTicketDatos
): Promise<TicketEntidad> => {
  const respuesta = await clienteAxios.post<RespuestaApi<TicketEntidad>>(
    '/tickets',
    datos
  );
  return respuesta.data.datos;
};

/**
 * Actualiza el estado de un ticket y dispara el registro automático en la auditoría del backend.
 * Endpoint: PATCH /api/tickets/:id/estado
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param nuevoEstado Estado a establecer ('abierto', 'en_progreso', 'resuelto', 'cerrado').
 * @returns Promesa con el ticket actualizado.
 */
export const cambiarEstadoTicketApi = async (
  idTicket: string,
  nuevoEstado: EstadoTicket
): Promise<TicketEntidad> => {
  const respuesta = await clienteAxios.patch<RespuestaApi<TicketEntidad>>(
    `/tickets/${idTicket}/estado`,
    { estado: nuevoEstado }
  );
  return respuesta.data.datos;
};

/**
 * Asigna o desasigna el agente técnico responsable del ticket.
 * Endpoint: PATCH /api/tickets/:id/asignacion
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param asignadoAId UUID del agente de soporte/administrador o `null` para desasignar.
 * @returns Promesa con el ticket actualizado.
 */
export const asignarTicketApi = async (
  idTicket: string,
  asignadoAId: string | null
): Promise<TicketEntidad> => {
  const respuesta = await clienteAxios.patch<RespuestaApi<TicketEntidad>>(
    `/tickets/${idTicket}/asignacion`,
    { asignado_a_id: asignadoAId }
  );
  return respuesta.data.datos;
};

/**
 * Obtiene el listado de comentarios asociados a un ticket en orden cronológico.
 * Endpoint: GET /api/tickets/:id/comentarios
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con los comentarios del ticket.
 */
export const listarComentariosApi = async (
  idTicket: string
): Promise<ComentarioEntidad[]> => {
  const respuesta = await clienteAxios.get<RespuestaApi<ComentarioEntidad[]>>(
    `/tickets/${idTicket}/comentarios`
  );
  return respuesta.data.datos;
};

/**
 * Publica un nuevo comentario en el hilo del ticket.
 * Endpoint: POST /api/tickets/:id/comentarios
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param contenido Texto del comentario.
 * @returns Promesa con el comentario creado.
 */
export const crearComentarioApi = async (
  idTicket: string,
  contenido: string
): Promise<ComentarioEntidad> => {
  const respuesta = await clienteAxios.post<RespuestaApi<ComentarioEntidad>>(
    `/tickets/${idTicket}/comentarios`,
    { contenido }
  );
  return respuesta.data.datos;
};

/**
 * Consulta la línea de tiempo de cambios de estado del ticket.
 * Endpoint: GET /api/tickets/:id/historial
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con los registros de historial.
 */
export const listarHistorialApi = async (
  idTicket: string
): Promise<HistorialTicketEntidad[]> => {
  const respuesta = await clienteAxios.get<RespuestaApi<HistorialTicketEntidad[]>>(
    `/tickets/${idTicket}/historial`
  );
  return respuesta.data.datos;
};

/**
 * Obtiene la lista de archivos adjuntos asociados al ticket.
 * Endpoint: GET /api/tickets/:id/adjuntos
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con el listado de adjuntos.
 */
export const listarAdjuntosApi = async (
  idTicket: string
): Promise<AdjuntoEntidad[]> => {
  const respuesta = await clienteAxios.get<RespuestaApi<AdjuntoEntidad[]>>(
    `/tickets/${idTicket}/adjuntos`
  );
  return respuesta.data.datos;
};

/**
 * Sube un archivo binario adjunto al ticket mediante multipart/form-data.
 * Endpoint: POST /api/tickets/:id/adjuntos
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param archivo Objeto `File` seleccionado por el usuario en el navegador.
 * @returns Promesa con los metadatos del adjunto guardado.
 */
export const subirAdjuntoApi = async (
  idTicket: string,
  archivo: File
): Promise<AdjuntoEntidad> => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const respuesta = await clienteAxios.post<RespuestaApi<AdjuntoEntidad>>(
    `/tickets/${idTicket}/adjuntos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return respuesta.data.datos;
};

/**
 * Solicita una URL firmada con expiración temporal (5 minutos) para descargar un archivo adjunto.
 * Endpoint: GET /api/tickets/:id/adjuntos/:idAdjunto/descargar
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idAdjunto Identificador UUID del adjunto.
 * @returns Promesa con la URL firmada de descarga.
 */
export const obtenerUrlDescargaAdjuntoApi = async (
  idTicket: string,
  idAdjunto: string
): Promise<DescargaAdjuntoRespuesta> => {
  const respuesta = await clienteAxios.get<RespuestaApi<DescargaAdjuntoRespuesta>>(
    `/tickets/${idTicket}/adjuntos/${idAdjunto}/descargar`
  );
  return respuesta.data.datos;
};
