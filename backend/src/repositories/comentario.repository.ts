/**
 * Repositorio de Comentarios
 * Capa de acceso a datos que gestiona las operaciones sobre la tabla 'comentarios_ticket' en Supabase.
 */

import { clienteSupabase } from '../config/supabase';
import { ComentarioEntidad, ComentarioParaCrear } from '../types/comentario.type';

/**
 * Inserta un nuevo comentario asociado a un ticket en la base de datos.
 * 
 * @param comentario Objeto con los datos del comentario (ticket_id, autor_id, contenido).
 * @returns Promesa con la entidad del comentario recién creada.
 */
export const insertarComentario = async (
  comentario: ComentarioParaCrear
): Promise<ComentarioEntidad> => {
  const { data, error } = await clienteSupabase
    .from('comentarios_ticket')
    .insert(comentario)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Error al insertar el comentario en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as ComentarioEntidad;
};

/**
 * Consulta todos los comentarios vinculados a un ticket en orden cronológico ascendente (más antiguos primero),
 * permitiendo construir el hilo de conversación estructurado en la interfaz.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con el listado ordenado de comentarios.
 */
export const listarComentariosPorTicket = async (
  idTicket: string
): Promise<ComentarioEntidad[]> => {
  const { data, error } = await clienteSupabase
    .from('comentarios_ticket')
    .select('*')
    .eq('ticket_id', idTicket)
    .order('fecha_creacion', { ascending: true });

  if (error) {
    throw new Error(
      `Error al listar los comentarios de la base de datos: ${error.message}`
    );
  }

  return (data || []) as ComentarioEntidad[];
};
