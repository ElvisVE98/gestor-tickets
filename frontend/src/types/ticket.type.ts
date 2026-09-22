/**
 * Definiciones de Tipos: Módulo de Tickets
 * Modela las entidades de tickets, estados, prioridades, comentarios, historial de cambios y archivos adjuntos.
 */

/**
 * Arreglos constantes inmutables: fuente única de verdad compartida con el backend.
 */
export const CATEGORIAS_TICKET = [
  'erp_flexline',
  'rindegasto',
  'soporte_ti',
  'solicitud_desarrollo',
  'otro',
] as const;

export const PRIORIDADES_TICKET = ['baja', 'media', 'alta', 'urgente'] as const;

export const ESTADOS_TICKET = ['abierto', 'en_progreso', 'resuelto', 'cerrado'] as const;

/** Tipos de unión derivados de los arreglos constantes */
export type CategoriaTicket = (typeof CATEGORIAS_TICKET)[number];
export type PrioridadTicket = (typeof PRIORIDADES_TICKET)[number];
export type EstadoTicket = (typeof ESTADOS_TICKET)[number];

/** Resumen de los datos de un usuario asociado en relaciones foráneas */
export interface UsuarioAsignadoResumen {
  id: string;
  nombre_completo: string;
}

/** Representación completa de un Ticket recibido desde el backend */
export interface TicketEntidad {
  id: string;
  folio: number;
  titulo: string;
  descripcion: string;
  categoria: CategoriaTicket;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  creador_id: string;
  creador?: UsuarioAsignadoResumen;
  asignado_a_id: string | null;
  asignado_a?: UsuarioAsignadoResumen | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_cierre: string | null;
}

/** Carga útil (payload) enviada para crear un nuevo ticket */
export interface CrearTicketDatos {
  titulo: string;
  descripcion: string;
  categoria: CategoriaTicket;
  prioridad: PrioridadTicket;
}

/** Parámetros opcionales para filtrar el listado de tickets */
export interface FiltrosListarTickets {
  estado?: EstadoTicket;
  categoria?: CategoriaTicket;
  prioridad?: PrioridadTicket;
  asignado?: 'asignado' | 'sin_asignar';
  buscar?: string;
  pagina?: number;
  limite?: number;
}

/** Estructura de respuesta paginada devuelta por la API de tickets */
export interface TicketsPaginadosRespuesta {
  tickets: TicketEntidad[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

/** Estructura de métricas/KPIs del panel de soporte */
export interface MetricasTicketsRespuesta {
  sinAsignar: number;
  abiertos: number;
  enProgreso: number;
  urgentesActivos: number;
}

/** Entidad de comentario en el hilo de un ticket */
export interface ComentarioEntidad {
  id: string;
  ticket_id: string;
  autor_id: string;
  contenido: string;
  fecha_creacion: string;
}

/** Entidad de registro histórico de cambio de estado */
export interface HistorialTicketEntidad {
  id: string;
  ticket_id: string;
  estado_anterior: EstadoTicket;
  estado_nuevo: EstadoTicket;
  modificado_por_id: string;
  fecha_cambio: string;
}

/** Entidad de archivo adjunto asociado a un ticket */
export interface AdjuntoEntidad {
  id: string;
  ticket_id: string;
  subido_por_id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_bytes: number;
  fecha_subida: string;
}

/** Respuesta del endpoint de descarga con la URL prefirmada */
export interface DescargaAdjuntoRespuesta {
  url: string;
}
