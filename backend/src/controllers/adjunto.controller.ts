/**
 * Controlador de Adjuntos
 * Capa de interfaz HTTP encargada de gestionar los endpoints REST para la subida de archivos,
 * listado de adjuntos y generación de URLs temporales firmadas de descarga.
 */

import { Request, Response, NextFunction } from 'express';
import {
  generarUrlDescargaAdjuntoServicio,
  listarAdjuntosServicio,
  subirAdjuntoServicio,
} from '../services/adjunto.service';

/**
 * Procesa la solicitud HTTP de subida de un archivo adjunto a un ticket específico.
 * Endpoint: POST /api/tickets/:id/adjuntos (form-data con campo 'archivo').
 * 
 * @param req Petición HTTP que incluye `req.file` procesado por el middleware Multer.
 * @param res Respuesta HTTP con el adjunto creado (201 Created).
 * @param next Función middleware para propagación de errores.
 */
export const subirAdjuntoControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { id: idUsuario, rol } = req.usuario!;
    const archivo = req.file;

    const adjuntoCreado = await subirAdjuntoServicio(
      idTicket,
      archivo,
      idUsuario,
      rol
    );

    return res.status(201).json({
      exito: true,
      mensaje: 'Archivo adjuntado exitosamente',
      datos: adjuntoCreado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para listar todos los archivos adjuntos de un ticket.
 * Endpoint: GET /api/tickets/:id/adjuntos
 * 
 * @param req Petición HTTP con el parámetro `id` del ticket.
 * @param res Respuesta HTTP con la lista de archivos adjuntos (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const listarAdjuntosControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { id: idUsuario, rol } = req.usuario!;

    const adjuntos = await listarAdjuntosServicio(idTicket, idUsuario, rol);

    return res.status(200).json({
      exito: true,
      mensaje: 'Adjuntos obtenidos exitosamente',
      datos: adjuntos,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para generar una URL temporal firmada para visualizar o descargar un archivo.
 * Endpoint: GET /api/tickets/:id/adjuntos/:idAdjunto/descargar
 * 
 * @param req Petición HTTP con los parámetros `id` (ticket) y `idAdjunto` en la ruta.
 * @param res Respuesta HTTP con el objeto conteniendo la URL prefirmada (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const descargarAdjuntoControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket, idAdjunto } = req.params;
    const { id: idUsuario, rol } = req.usuario!;

    const urlFirmada = await generarUrlDescargaAdjuntoServicio(
      idTicket,
      idAdjunto,
      idUsuario,
      rol
    );

    return res.status(200).json({
      exito: true,
      mensaje: 'URL de descarga generada exitosamente',
      datos: {
        url: urlFirmada,
      },
    });
  } catch (error) {
    return next(error);
  }
};

