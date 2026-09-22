/**
 * Definiciones de tipos y constantes para el dominio de Tickets e Historial.
 * Define categorías, prioridades, estados del ciclo de vida y estructuras de entidades.
 */

// Arreglos constantes inmutables: fuente única de verdad para la base de datos y esquemas
export const CATEGORIAS_TICKET = [
  'erp_flexline',
  'rindegasto',
  'soporte_ti',
  'solicitud_desarrollo',
  'otro',
] as const;

export const PRIORIDADES_TICKET = ['baja', 'media', 'alta', 'urgente'] as const;

export const ESTADOS_TICKET = ['abierto', 'en_progreso', 'resuelto', 'cerrado'] as const;

// Tipos TypeScript derivados automáticamente
export type CategoriaTicket = (typeof CATEGORIAS_TICKET)[number];
export type PrioridadTicket = (typeof PRIORIDADES_TICKET)[number];
export type EstadoTicket = (typeof ESTADOS_TICKET)[number];

// Estructura resumida del usuario obtenida mediante las relaciones de foreign key en Supabase
export interface UsuarioAsignadoResumen {
  id: string;
  nombre_completo: string;
}

// Estructura de la entidad de la tabla 'tickets' con datos anidados del creador y asignado
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

// Estructura para la inserción de un nuevo ticket en la base de datos
export interface TicketParaCrear {
  titulo: string;
  descripcion: string;
  categoria: CategoriaTicket;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  creador_id: string;
  asignado_a_id?: string | null;
}

// Estructura para registrar auditoría en la tabla 'historial_ticket'
export interface HistorialParaCrear {
  ticket_id: string;
  estado_anterior: EstadoTicket;
  estado_nuevo: EstadoTicket;
  modificado_por_id: string;
}

// Estructura de la entidad de la tabla 'historial_ticket'
export interface HistorialTicketEntidad extends HistorialParaCrear {
  id: string;
  fecha_cambio: string;
}

// Filtros opcionales para la consulta y listado de tickets en repositorios y controladores
export interface FiltrosListarTickets {
  estado?: EstadoTicket;
  categoria?: CategoriaTicket;
  prioridad?: PrioridadTicket;
  asignado?: 'asignado' | 'sin_asignar';
  buscar?: string;
  pagina?: number;
  limite?: number;
}

// Estructura de respuesta paginada devuelta por el servicio y repositorio de tickets
export interface ResultadoListarTicketsPaginado {
  tickets: TicketEntidad[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

// Estructura de respuesta para el resumen de métricas/KPIs del panel de soporte
export interface MetricasTicketsRespuesta {
  sinAsignar: number;
  abiertos: number;
  enProgreso: number;
  urgentesActivos: number;
}

