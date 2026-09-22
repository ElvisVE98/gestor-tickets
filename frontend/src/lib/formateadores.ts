/**
 * Módulo de Formateadores y Diccionarios de Presentación
 * Centraliza las funciones de transformación visual (folios, fechas) y diccionarios
 * de traducción de estados, categorías y prioridades compartidos en toda la aplicación.
 */

import {
  CategoriaTicket,
  EstadoTicket,
  PrioridadTicket,
} from '@/types/ticket.type';

/**
 * Formatea un número secuencial de folio al formato corporativo estándar (CUR-XXXX).
 * 
 * @param folio Número correlativo del ticket.
 * @returns Cadena con prefijo 'CUR-' y relleno a 4 dígitos (ej: CUR-0042).
 */
export function formatearFolio(folio: number): string {
  return `CUR-${folio.toString().padStart(4, '0')}`;
}

/**
 * Convierte una fecha ISO 8601 a una cadena legible en zona horaria chilena (DD/MM/AAAA HH:mm).
 * 
 * @param fechaIso Cadena de fecha en formato ISO.
 * @returns Fecha y hora formateada o la cadena original en caso de error.
 */
export function formatearFecha(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  } catch {
    return fechaIso;
  }
}

/**
 * Diccionario de nombres descriptivos en español para las categorías de tickets.
 */
export const NOMBRES_CATEGORIAS: Record<CategoriaTicket, string> = {
  erp_flexline: 'Flexline ERP',
  rindegasto: 'Rindegastos',
  soporte_ti: 'Soporte TI',
  solicitud_desarrollo: 'Desarrollo',
  otro: 'Otro',
};

/**
 * Diccionario de nombres descriptivos en español para los estados de tickets.
 */
export const NOMBRES_ESTADOS: Record<EstadoTicket, string> = {
  abierto: 'Abierto',
  en_progreso: 'En progreso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

/**
 * Diccionario de nombres descriptivos en español para los niveles de prioridad.
 */
export const NOMBRES_PRIORIDADES: Record<PrioridadTicket, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};
