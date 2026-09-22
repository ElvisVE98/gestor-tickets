/**
 * Servicio de Usuarios
 * Capa de lógica de negocio para la administración de perfiles de usuario,
 * invitaciones mediante Supabase Auth y control de roles y estados.
 */

import { clienteSupabase } from '../config/supabase';
import {
  insertarUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarRolUsuario,
  desactivarUsuario,
  listarAgentesSoporte,
} from '../repositories/usuario.repository';
import { InvitarUsuarioEntrada } from '../schemas/usuario.schema';
import {
  UsuarioEntidad,
  RolUsuario,
  UsuarioParaCrear,
  AgenteSoporteEntidad,
} from '../types/usuario.type';
import { ErrorApp, ErrorNoEncontrado } from '../errors/app.error';

/**
 * Determina si el error devuelto por el API de Supabase Auth corresponde a un conflicto
 * de correo electrónico duplicado o ya registrado previamente.
 * 
 * @param errorAuth Objeto de error retornado por Supabase Auth.
 * @returns `true` si corresponde a un usuario ya existente; `false` en caso contrario.
 */
const esErrorUsuarioYaRegistrado = (errorAuth: any): boolean => {
  const codigoEstado = errorAuth?.status;
  const codigoError = errorAuth?.code;
  const mensajeError = errorAuth?.message?.toLowerCase() || '';

  return (
    codigoEstado === 422 ||
    codigoError === 'email_exists' ||
    codigoError === 'user_already_exists' ||
    mensajeError.includes('already') ||
    mensajeError.includes('registered') ||
    mensajeError.includes('duplicate')
  );
};

/**
 * Orquesta el flujo de invitación de un nuevo usuario al sistema.
 * 
 * Flujo y decisiones de diseño:
 * 1. Envía la invitación por correo electrónico utilizando el API administrativo de Supabase Auth (`inviteUserByEmail`).
 * 2. Si el correo ya existe, captura el error específico y lo transforma en un `ErrorApp(400)` legible para el cliente.
 * 3. Crea el perfil inicial en la tabla 'usuarios' con rol por defecto 'solicitante' y estado activo.
 * 4. Aplica una transacción compensatoria (rollback manual): si la inserción en la base de datos falla,
 *    se elimina el usuario recién creado en Supabase Auth (`deleteUser`) para evitar cuentas huérfanas sin perfil.
 * 
 * @param datosInvitacion Datos de entrada validados (nombre_completo, correo_electronico).
 * @returns Promesa con la entidad del usuario creado.
 */
export const invitarUsuarioServicio = async (
  datosInvitacion: InvitarUsuarioEntrada
): Promise<UsuarioEntidad> => {
  const correoNormalizado = datosInvitacion.correo_electronico.toLowerCase();

  // 1. Enviar invitación administrativa a través de Supabase Auth
  const { data: datosAuth, error: errorAuth } =
    await clienteSupabase.auth.admin.inviteUserByEmail(correoNormalizado);

  if (errorAuth || !datosAuth.user) {
    if (esErrorUsuarioYaRegistrado(errorAuth)) {
      throw new ErrorApp(
        'Ya existe un usuario registrado o invitado con este correo electrónico',
        400
      );
    }

    throw new ErrorApp(
      `Error al enviar la invitación: ${errorAuth?.message || 'Fallo desconocido'}`,
      400
    );
  }

  const idUsuarioAuth = datosAuth.user.id;

  // 2. Preparar el registro inicial del perfil en la tabla 'usuarios'
  const nuevoUsuario: UsuarioParaCrear = {
    id: idUsuarioAuth,
    nombre_completo: datosInvitacion.nombre_completo,
    correo_electronico: correoNormalizado,
    rol: 'solicitante',
    activo: true,
  };

  try {
    return await insertarUsuario(nuevoUsuario);
  } catch (errorDb) {
    // Transacción compensatoria: si la base de datos falla, eliminamos el usuario creado en auth
    await clienteSupabase.auth.admin.deleteUser(idUsuarioAuth);
    throw errorDb;
  }
};

/**
 * Obtiene la lista completa de todos los usuarios registrados en el sistema.
 * 
 * @returns Promesa con el listado de usuarios.
 */
export const listarUsuariosServicio = async (): Promise<UsuarioEntidad[]> => {
  return await listarUsuarios();
};

/**
 * Actualiza el rol asignado a un usuario previa verificación de su existencia.
 * 
 * @param idUsuario Identificador UUID del usuario a modificar.
 * @param nuevoRol Nuevo rol ('solicitante' | 'soporte' | 'administrador').
 * @returns Promesa con la entidad de usuario actualizada.
 */
export const cambiarRolUsuarioServicio = async (
  idUsuario: string,
  nuevoRol: RolUsuario
): Promise<UsuarioEntidad> => {
  const usuario = await obtenerUsuarioPorId(idUsuario);

  if (!usuario) {
    throw new ErrorNoEncontrado('Usuario no encontrado');
  }

  return await actualizarRolUsuario(idUsuario, nuevoRol);
};

/**
 * Desactiva un usuario en el sistema aplicando reglas de seguridad estrictas:
 * 1. Evita que un administrador se desactive a sí mismo accidentalmente.
 * 2. Verifica la existencia del usuario en la base de datos.
 * 3. Valida idempotencia (no desactivar a un usuario que ya esté inactivo).
 * 
 * @param idUsuario Identificador UUID del usuario a desactivar.
 * @param idAdminAutenticado Identificador UUID del administrador que ejecuta la acción.
 * @returns Promesa con el usuario desactivado.
 */
export const desactivarUsuarioServicio = async (
  idUsuario: string,
  idAdminAutenticado: string
): Promise<UsuarioEntidad> => {
  // 1. Proteger contra auto-desactivación accidental del administrador
  if (idUsuario === idAdminAutenticado) {
    throw new ErrorApp(
      'No puedes desactivar tu propia cuenta de administrador',
      400
    );
  }

  // 2. Verificar existencia del usuario
  const usuario = await obtenerUsuarioPorId(idUsuario);

  if (!usuario) {
    throw new ErrorNoEncontrado('Usuario no encontrado');
  }

  // 3. Verificar si ya se encuentra desactivado
  if (!usuario.activo) {
    throw new ErrorApp('El usuario ya se encuentra desactivado', 400);
  }

  const fechaDesvinculacion = new Date().toISOString();
  return await desactivarUsuario(idUsuario, fechaDesvinculacion);
};

/**
 * Consulta el perfil de usuario correspondiente a la sesión autenticada actual.
 * 
 * @param idUsuario Identificador UUID del usuario autenticado.
 * @returns Promesa con la entidad del usuario.
 */
export const obtenerPerfilUsuarioAutenticadoServicio = async (
  idUsuario: string
): Promise<UsuarioEntidad> => {
  const usuario = await obtenerUsuarioPorId(idUsuario);

  if (!usuario) {
    throw new ErrorNoEncontrado('Usuario no encontrado');
  }

  return usuario;
};

/**
 * Obtiene la lista de usuarios activos con roles habilitados para soporte ('soporte' y 'administrador').
 * 
 * @returns Promesa con el listado de agentes de soporte disponibles.
 */
export const listarAgentesSoporteServicio = async (): Promise<AgenteSoporteEntidad[]> => {
  return await listarAgentesSoporte();
};
