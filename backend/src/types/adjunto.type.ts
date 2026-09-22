/**
 * Definiciones de tipos y constantes para el dominio de Archivos Adjuntos.
 * Define límites de almacenamiento, formatos permitidos y modelos de base de datos.
 */

// Nombre del bucket de almacenamiento en Supabase Storage
export const BUCKET_ADJUNTOS = 'adjuntos-tickets';

// Tipos MIME permitidos (imágenes y PDFs)
export const TIPOS_MIME_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

// Límite de tamaño máximo por archivo: 5 Megabytes (5 * 1024 * 1024 bytes)
export const TAMANO_MAXIMO_ADJUNTO_BYTES = 5 * 1024 * 1024;

// Estructura de la entidad en la tabla 'adjuntos_ticket'
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

// Estructura para registrar los metadatos de un nuevo adjunto en la base de datos
export interface AdjuntoParaCrear {
  ticket_id: string;
  subido_por_id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_bytes: number;
}
