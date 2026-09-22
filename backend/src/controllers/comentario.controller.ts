/**
 * Controlador de Comentarios
 * Capa de interfaz HTTP encargada de gestionar los endpoints REST para la creación
 * y consulta de comentarios asociados a tickets de soporte.
 */

import { Request, Response, NextFunction } from 'express';
import {
  crearComentarioServicio,
  listarComentariosServicio,
} from '../services/comentario.service';
import { CrearComentarioEntrada } from '../schemas/comentario.schema';

/**
 * Procesa la solicitud HTTP para agregar un nuevo comentario a un ticket.
 * Endpoint: POST /api/tickets/:id/comentarios
 * 
 * @param req Petición HTTP con el parámetro `id` del ticket en URL y `contenido` en el cuerpo.
 * @param res Respuesta HTTP con el comentario creado (201 Created).
 * @param next Función middleware para propagación de errores.
 */
export const crearComentarioControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { contenido } = req.body as CrearComentarioEntrada;
    const { id: idUsuario, rol } = req.usuario!;

    const comentarioCreado = await crearComentarioServicio(
      idTicket,
      contenido,
      idUsuario,
      rol
    );

    return res.status(201).json({
      exito: true,
      mensaje: 'Comentario agregado exitosamente',
      datos: comentarioCreado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para obtener el listado cronológico de comentarios de un ticket.
 * Endpoint: GET /api/tickets/:id/comentarios
 * 
 * @param req Petición HTTP con el parámetro `id` del ticket.
 * @param res Respuesta HTTP con la lista de comentarios (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const listarComentariosControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { id: idUsuario, rol } = req.usuario!;

    const comentarios = await listarComentariosServicio(idTicket, idUsuario, rol);

    return res.status(200).json({
      exito: true,
      mensaje: 'Comentarios obtenidos exitosamente',
      datos: comentarios,
    });
  } catch (error) {
    return next(error);
  }
};

