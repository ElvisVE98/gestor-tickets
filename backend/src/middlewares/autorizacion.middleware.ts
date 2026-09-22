/**
 * Middleware de Autorización
 * Capa de control de acceso basada en roles (RBAC - Role-Based Access Control)
 * que restringe el acceso a rutas protegidas según el perfil del usuario autenticado.
 */

import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '../types/usuario.type';

/**
 * Fábrica de middleware de orden superior para restringir el acceso a endpoints según roles permitidos.
 * 
 * Flujo:
 * 1. Verifica que la solicitud contenga un `req.usuario` inyectado previamente por `autenticacionMiddleware`.
 * 2. Comprueba si el rol del usuario forma parte del arreglo de roles autorizados.
 * 3. Si no cuenta con permisos, rechaza con código 403 Forbidden.
 * 4. Si está autorizado, delega la ejecución al siguiente middleware o controlador.
 * 
 * @param rolesPermitidos Lista de roles con permiso para acceder al recurso ('solicitante', 'soporte', 'administrador').
 * @returns Middleware de Express que valida el rol del usuario.
 */
export const requiereRol = (...rolesPermitidos: RolUsuario[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void | Response => {
    // 1. Validar que la petición haya pasado previamente por el middleware de autenticación
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No se encontró un usuario autenticado en la petición',
      });
    }

    // 2. Comprobar si el rol del usuario forma parte de los roles permitidos
    const tienePermiso = rolesPermitidos.includes(req.usuario.rol);

    if (!tienePermiso) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para realizar esta acción',
      });
    }

    // 3. Continuar al siguiente middleware/controlador en el flujo exitoso
    return next();
  };
};
