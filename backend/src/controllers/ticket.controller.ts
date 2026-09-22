/**
 * Controlador de Tickets
 * Capa de interfaz HTTP encargada de gestionar los endpoints REST del ciclo de vida de los tickets,
 * transiciones de estado, asignaciones y auditoría.
 */

import { Request, Response, NextFunction } from 'express';
import {
  crearTicketServicio,
  listarTicketsServicio,
  obtenerTicketPorIdServicio,
  cambiarEstadoTicketServicio,
  asignarTicketServicio,
  listarHistorialTicketServicio,
  obtenerMetricasTicketsServicio,
} from '../services/ticket.service';
import {
  CrearTicketEntrada,
  CambiarEstadoTicketEntrada,
  AsignarTicketEntrada,
  esquemaFiltrosTicket,
} from '../schemas/ticket.schema';

/**
 * Procesa la solicitud HTTP para crear un nuevo ticket de soporte.
 * Endpoint: POST /api/tickets
 * 
 * @param req Petición HTTP con los datos validados del ticket y el usuario autenticado en `req.usuario`.
 * @param res Respuesta HTTP con el ticket creado (201 Created).
 * @param next Función middleware para propagación de errores.
 */
export const crearTicketControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const datosEntrada = req.body as CrearTicketEntrada;
    const idCreador = req.usuario!.id;

    const ticketCreado = await crearTicketServicio(datosEntrada, idCreador);

    return res.status(201).json({
      exito: true,
      mensaje: 'Ticket creado exitosamente',
      datos: ticketCreado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para listar tickets con soporte de filtros opcionales y paginación.
 * Endpoint: GET /api/tickets
 * 
 * @param req Petición HTTP con query params validados por `esquemaFiltrosTicket` y rol de `req.usuario`.
 * @param res Respuesta HTTP con el objeto paginado de tickets (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const listarTicketsControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id, rol } = req.usuario!;
    const filtros = esquemaFiltrosTicket.parse(req.query);

    const resultadoPaginado = await listarTicketsServicio(id, rol, filtros);

    return res.status(200).json({
      exito: true,
      mensaje: 'Tickets obtenidos exitosamente',
      datos: resultadoPaginado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para obtener los indicadores/KPIs de la mesa de ayuda.
 * Endpoint: GET /api/tickets/metricas
 * 
 * @param _req Petición HTTP.
 * @param res Respuesta HTTP con los 4 conteos globales (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const obtenerMetricasTicketsControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const metricas = await obtenerMetricasTicketsServicio();

    return res.status(200).json({
      exito: true,
      mensaje: 'Métricas obtenidas exitosamente',
      datos: metricas,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para obtener el detalle de un ticket por su identificador.
 * Endpoint: GET /api/tickets/:id
 * 
 * @param req Petición HTTP con el parámetro `id` del ticket en URL.
 * @param res Respuesta HTTP con los datos completos del ticket (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const obtenerTicketPorIdControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { id: idUsuario, rol } = req.usuario!;

    const ticket = await obtenerTicketPorIdServicio(idTicket, idUsuario, rol);

    return res.status(200).json({
      exito: true,
      mensaje: 'Ticket obtenido exitosamente',
      datos: ticket,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para cambiar el estado de un ticket y registrar el evento de auditoría.
 * Endpoint: PATCH /api/tickets/:id/estado
 * 
 * @param req Petición HTTP con `id` en URL y `{ estado }` en el cuerpo.
 * @param res Respuesta HTTP con el ticket actualizado (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const cambiarEstadoTicketControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { estado: estadoNuevo } = req.body as CambiarEstadoTicketEntrada;
    const idUsuarioQueModifica = req.usuario!.id;

    const ticketActualizado = await cambiarEstadoTicketServicio(
      idTicket,
      estadoNuevo,
      idUsuarioQueModifica
    );

    return res.status(200).json({
      exito: true,
      mensaje: 'Estado del ticket actualizado exitosamente',
      datos: ticketActualizado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para asignar o desasignar un agente responsable a un ticket.
 * Endpoint: PATCH /api/tickets/:id/asignar
 * 
 * @param req Petición HTTP con `id` en URL y `{ asignado_a_id }` en el cuerpo.
 * @param res Respuesta HTTP con el ticket actualizado (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const asignarTicketControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { asignado_a_id } = req.body as AsignarTicketEntrada;

    const ticketActualizado = await asignarTicketServicio(idTicket, asignado_a_id);

    return res.status(200).json({
      exito: true,
      mensaje: 'Asignación del ticket actualizada exitosamente',
      datos: ticketActualizado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para consultar la línea de tiempo histórica de un ticket.
 * Endpoint: GET /api/tickets/:id/historial
 * 
 * @param req Petición HTTP con el parámetro `id` del ticket.
 * @param res Respuesta HTTP con el arreglo cronológico de historial (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const listarHistorialTicketControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idTicket } = req.params;
    const { id: idUsuario, rol } = req.usuario!;

    const historial = await listarHistorialTicketServicio(idTicket, idUsuario, rol);

    return res.status(200).json({
      exito: true,
      mensaje: 'Historial obtenido exitosamente',
      datos: historial,
    });
  } catch (error) {
    return next(error);
  }
};
