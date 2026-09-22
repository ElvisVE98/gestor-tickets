/**
 * Servicio de Comentarios
 * Capa de lógica de negocio para la gestión y consulta de comentarios asociados a tickets.
 */

import {
  insertarComentario,
  listarComentariosPorTicket,
} from '../repositories/comentario.repository';
import { obtenerTicketPorIdServicio } from './ticket.service';
import { ComentarioEntidad, ComentarioParaCrear } from '../types/comentario.type';
import { RolUsuario } from '../types/usuario.type';

/**
 * Agrega un nuevo comentario a un ticket existente.
 * 
 * Flujo:
 * 1. Valida mediante `obtenerTicketPorIdServicio` que el ticket exista y que el usuario tenga permisos para visualizarlo.
 * 2. Asocia automáticamente el `autor_id` con el identificador del usuario autenticado en la sesión.
 * 3. Persiste el comentario en la base de datos.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param contenido Texto del comentario validado.
 * @param idUsuario Identificador UUID del autor autenticado.
 * @param rol Rol del usuario autenticado.
 * @returns Promesa con la entidad del comentario creado.
 */
export const crearComentarioServicio = async (
  idTicket: string,
  contenido: string,
  idUsuario: string,
  rol: RolUsuario
): Promise<ComentarioEntidad> => {
  // 1. Validar que el ticket exista y que el usuario tenga acceso de visibilidad (reutilización DRY)
  await obtenerTicketPorIdServicio(idTicket, idUsuario, rol);

  // 2. Preparar los datos del comentario con autor_id proveniente de la sesión autenticada
  const nuevoComentario: ComentarioParaCrear = {
    ticket_id: idTicket,
    autor_id: idUsuario,
    contenido,
  };

  // 3. Insertar el comentario en la base de datos
  return await insertarComentario(nuevoComentario);
};

/**
 * Obtiene el listado completo de comentarios de un ticket en orden cronológico.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idUsuario Identificador UUID del usuario consultante.
 * @param rol Rol del usuario autenticado.
 * @returns Promesa con el listado de comentarios.
 */
export const listarComentariosServicio = async (
  idTicket: string,
  idUsuario: string,
  rol: RolUsuario
): Promise<ComentarioEntidad[]> => {
  // 1. Validar que el ticket exista y que el usuario tenga acceso de visibilidad (reutilización DRY)
  await obtenerTicketPorIdServicio(idTicket, idUsuario, rol);

  // 2. Obtener y retornar los comentarios en orden cronológico ascendente
  return await listarComentariosPorTicket(idTicket);
};
