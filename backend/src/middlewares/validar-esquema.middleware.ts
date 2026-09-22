/**
 * Middleware de Validación de Esquemas Zod
 * Capa de validación declarativa que asegura que el cuerpo (body) de las peticiones cumpla
 * con las reglas de negocio, tipos y restricciones antes de alcanzar los controladores.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Fábrica de middleware que valida el cuerpo (`req.body`) de la petición contra un esquema de Zod.
 * 
 * Flujo:
 * 1. Ejecuta `safeParseAsync` sobre `req.body`.
 * 2. Si la validación falla, genera una lista limpia de errores con el nombre del campo y mensaje amigable (400 Bad Request).
 * 3. Si la validación es exitosa, reemplaza `req.body` con los datos transformados y sanitizados por Zod.
 * 
 * @param esquema Esquema de Zod a evaluar.
 * @returns Middleware asíncrono de Express.
 */
export const validarEsquema = (esquema: ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    try {
      const resultado = await esquema.safeParseAsync(req.body);

      if (!resultado.success) {
        // Formatear los errores de validación de forma clara y amigable
        const errores = resultado.error.errors.map((error) => ({
          campo: error.path.join('.'),
          mensaje: error.message,
        }));

        return res.status(400).json({
          exito: false,
          mensaje: 'Error de validación en los datos enviados',
          errores,
        });
      }

      // Reemplazar el body con los datos limpios y transformados por Zod
      req.body = resultado.data;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};
