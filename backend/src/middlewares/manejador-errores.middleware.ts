/**
 * Middleware Global de Manejo de Errores
 * Capa centralizada de captura y formateo de excepciones para toda la aplicación Express.
 */

import { Request, Response, NextFunction } from 'express';
import { entorno } from '../config/entorno';
import { ErrorApp } from '../errors/app.error';

/**
 * Manejador global de excepciones no capturadas en los controladores y middlewares.
 * 
 * Flujo:
 * 1. Si el error es una instancia de `ErrorApp` (error operacional conocido, ej. 400, 403, 404),
 *    devuelve una respuesta JSON estructurada con el código de estado correspondiente.
 * 2. Si es un error desconocido (ej. fallo de red, crash inesperado), registra el error en la consola del servidor
 *    y responde con código 500 Internal Server Error, ocultando detalles técnicos en entornos de producción.
 * 
 * @param error Objeto de error interceptado.
 * @param _req Petición HTTP Express.
 * @param res Respuesta HTTP Express.
 * @param _next Función middleware de continuación.
 */
export const manejadorErrores = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Errores operacionales y controlados de la aplicación (ej: 404 No encontrado)
  if (error instanceof ErrorApp) {
    res.status(error.codigoEstado).json({
      exito: false,
      mensaje: error.message,
    });
    return;
  }

  // 2. Errores técnicos no controlados (500)
  console.error('❌ Error no controlado capturado por el middleware:', error);

  res.status(500).json({
    exito: false,
    mensaje: 'Ocurrió un error interno en el servidor',
    detalle: entorno.NODE_ENV === 'development' ? error.message : undefined,
  });
};
