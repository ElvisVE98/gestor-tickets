/**
 * Definiciones de tipos para el dominio de Comentarios de Tickets.
 * Modela los mensajes del hilo de conversación asociado a cada ticket.
 */

// Estructura de la entidad en la tabla 'comentarios_ticket'
export interface ComentarioEntidad {
  id: string;
  ticket_id: string;
  autor_id: string;
  contenido: string;
  fecha_creacion: string;
}

// Estructura para insertar un comentario en la base de datos
export interface ComentarioParaCrear {
  ticket_id: string;
  autor_id: string;
  contenido: string;
}
