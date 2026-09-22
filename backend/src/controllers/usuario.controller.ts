/**
 * Controlador de Usuarios
 * Capa de interfaz HTTP encargada de recibir las peticiones REST, orquestar los servicios
 * del módulo de usuarios y estructurar las respuestas JSON estandarizadas.
 */

import { Request, Response, NextFunction } from 'express';
import {
  invitarUsuarioServicio,
  listarUsuariosServicio,
  cambiarRolUsuarioServicio,
  desactivarUsuarioServicio,
  obtenerPerfilUsuarioAutenticadoServicio,
  listarAgentesSoporteServicio,
} from '../services/usuario.service';
import {
  InvitarUsuarioEntrada,
  CambiarRolUsuarioEntrada,
} from '../schemas/usuario.schema';

/**
 * Procesa la solicitud HTTP para invitar a un nuevo usuario al sistema.
 * Endpoint: POST /api/usuarios/invitar
 * 
 * @param req Petición HTTP con el cuerpo validado por Zod (`InvitarUsuarioEntrada`).
 * @param res Respuesta HTTP donde se envía el usuario creado con código 201 Created.
 * @param next Función middleware para propagación de errores hacia el manejador global.
 */
export const invitarUsuarioControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const datosEntrada = req.body as InvitarUsuarioEntrada;

    const usuarioCreado = await invitarUsuarioServicio(datosEntrada);

    return res.status(201).json({
      exito: true,
      mensaje: 'Invitación enviada y usuario registrado exitosamente',
      datos: usuarioCreado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para listar todos los usuarios del sistema.
 * Endpoint: GET /api/usuarios
 * 
 * @param _req Petición HTTP entrante (no requiere parámetros).
 * @param res Respuesta HTTP con la lista completa de usuarios (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const listarUsuariosControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const usuarios = await listarUsuariosServicio();

    return res.status(200).json({
      exito: true,
      mensaje: 'Usuarios obtenidos exitosamente',
      datos: usuarios,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para modificar el rol de un usuario existente.
 * Endpoint: PATCH /api/usuarios/:id/rol
 * 
 * @param req Petición HTTP con el parámetro `id` en URL y `rol` en el cuerpo.
 * @param res Respuesta HTTP con el usuario modificado (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const cambiarRolUsuarioControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idUsuario } = req.params;
    const { rol: nuevoRol } = req.body as CambiarRolUsuarioEntrada;

    const usuarioActualizado = await cambiarRolUsuarioServicio(idUsuario, nuevoRol);

    return res.status(200).json({
      exito: true,
      mensaje: 'Rol de usuario actualizado exitosamente',
      datos: usuarioActualizado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para desactivar la cuenta de un usuario.
 * Endpoint: PATCH /api/usuarios/:id/desactivar
 * 
 * Decisión técnica: Se extrae `req.usuario!.id` de la sesión autenticada para validar
 * en el servicio que un administrador no intente desactivarse a sí mismo.
 * 
 * @param req Petición HTTP con el parámetro `id` del usuario a desactivar.
 * @param res Respuesta HTTP con el usuario desactivado (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const desactivarUsuarioControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id: idUsuario } = req.params;
    const idAdminAutenticado = req.usuario!.id;

    const usuarioDesactivado = await desactivarUsuarioServicio(
      idUsuario,
      idAdminAutenticado
    );

    return res.status(200).json({
      exito: true,
      mensaje: 'Usuario desactivado exitosamente',
      datos: usuarioDesactivado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para consultar el perfil del usuario autenticado en la sesión.
 * Endpoint: GET /api/usuarios/yo
 * 
 * @param req Petición HTTP que contiene `req.usuario` inyectado por el middleware de autenticación.
 * @param res Respuesta HTTP con los datos esenciales del perfil (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const obtenerPerfilUsuarioAutenticadoControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const perfil = await obtenerPerfilUsuarioAutenticadoServicio(req.usuario!.id);

    return res.status(200).json({
      exito: true,
      mensaje: 'Perfil de usuario obtenido exitosamente',
      datos: {
        id: perfil.id,
        nombre_completo: perfil.nombre_completo,
        correo_electronico: perfil.correo_electronico,
        rol: perfil.rol,
        activo: perfil.activo,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Procesa la solicitud HTTP para listar agentes de soporte y administradores activos.
 * Endpoint: GET /api/usuarios/agentes
 * 
 * @param _req Petición HTTP entrante.
 * @param res Respuesta HTTP con el listado de agentes de soporte disponibles (200 OK).
 * @param next Función middleware para propagación de errores.
 */
export const listarAgentesSoporteControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const agentes = await listarAgentesSoporteServicio();

    return res.status(200).json({
      exito: true,
      mensaje: 'Agentes de soporte obtenidos exitosamente',
      datos: agentes,
    });
  } catch (error) {
    return next(error);
  }
};

