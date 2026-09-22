/**
 * Middleware de Autenticación
 * Capa de seguridad que intercepta las peticiones HTTP para validar el token JWT de Supabase Auth,
 * verificar el estado activo del usuario en la base de datos e inyectar el contexto de sesión en `req.usuario`.
 */

import { Request, Response, NextFunction } from 'express';
import { clienteSupabase } from '../config/supabase';
import { UsuarioAutenticado } from '../types/usuario.type';

/**
 * Valida la autenticidad del token Bearer provisto en la cabecera Authorization.
 * 
 * Flujo de ejecución:
 * 1. Extrae y comprueba el formato de la cabecera `Authorization: Bearer <token>`.
 * 2. Verifica la firma y validez del token con el servidor de Supabase Auth (`getUser`).
 * 3. Consulta el perfil en la base de datos para obtener el rol y estado activo actualizados.
 * 4. Aplica control de baja lógica (rechaza la solicitud si el usuario está desactivado).
 * 5. Inyecta el objeto `{ id, nombre_completo, rol }` en `req.usuario` para uso downstream en controladores.
 * 
 * @param req Petición Express entrante.
 * @param res Respuesta Express para devolver 401 Unauthorized o 403 Forbidden en caso de fallo.
 * @param next Función para transferir el control al siguiente middleware o controlador.
 */
export const autenticacionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // 1. Extraer la cabecera Authorization
    const cabeceraAutorizacion = req.headers.authorization;

    if (!cabeceraAutorizacion || !cabeceraAutorizacion.startsWith('Bearer ')) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No se proporcionó un token de autenticación válido',
      });
    }

    // 2. Extraer el token Bearer
    const token = cabeceraAutorizacion.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Formato de token inválido',
      });
    }

    // 3. Validar el token contra Supabase Auth
    const { data: datosAuth, error: errorAuth } = await clienteSupabase.auth.getUser(token);

    if (errorAuth || !datosAuth.user) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token de autenticación inválido o expirado',
      });
    }

    const idUsuarioAuth = datosAuth.user.id;

    // 4. Consultar el perfil en la tabla usuarios usando .single()
    const { data: usuario, error: errorUsuario } = await clienteSupabase
      .from('usuarios')
      .select('id, nombre_completo, rol, activo')
      .eq('id', idUsuarioAuth)
      .single();

    if (errorUsuario || !usuario) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu cuenta no tiene acceso a la plataforma',
      });
    }

    // 5. Verificar si el usuario está activo (control de borrado lógico)
    if (!usuario.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu cuenta no tiene acceso a la plataforma',
      });
    }

    // 6. Adjuntar la información del usuario tipado al objeto Request
    req.usuario = {
      id: usuario.id,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
    } as UsuarioAutenticado;

    // 7. Continuar al siguiente middleware/controlador únicamente en el flujo exitoso
    return next();
  } catch (error) {
    return next(error);
  }
};
