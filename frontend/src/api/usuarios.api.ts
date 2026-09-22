/**
 * Cliente de API: Módulo de Usuarios
 * Funciones asíncronas para interactuar con los endpoints REST de usuarios, perfil propio,
 * catálogo de agentes de soporte, invitaciones, cambio de roles y desactivación.
 */

import { clienteAxios } from './axios.config';
import {
  PerfilUsuario,
  AgenteSoporte,
  UsuarioEntidad,
  InvitarUsuarioDatos,
  RolUsuario,
  RespuestaApi,
} from '@/types/usuario.type';

/**
 * Consulta el perfil completo del usuario autenticado en la sesión activa.
 * Endpoint: GET /api/usuarios/yo
 * 
 * @returns Promesa con el perfil del usuario autenticado.
 */
export const obtenerMiPerfilApi = async (): Promise<PerfilUsuario> => {
  const respuesta = await clienteAxios.get<RespuestaApi<PerfilUsuario>>('/usuarios/yo');
  return respuesta.data.datos;
};

/**
 * Consulta los usuarios activos capacitados para soporte ('soporte' y 'administrador').
 * Endpoint: GET /api/usuarios/agentes
 * 
 * @returns Promesa con el listado de agentes para selectores de asignación.
 */
export const listarAgentesSoporteApi = async (): Promise<AgenteSoporte[]> => {
  const respuesta = await clienteAxios.get<RespuestaApi<AgenteSoporte[]>>('/usuarios/agentes');
  return respuesta.data.datos;
};

/**
 * Consulta el listado completo de usuarios registrados (exclusivo para rol administrador).
 * Endpoint: GET /api/usuarios
 * 
 * @returns Promesa con la lista total de usuarios.
 */
export const listarUsuariosApi = async (): Promise<UsuarioEntidad[]> => {
  const respuesta = await clienteAxios.get<RespuestaApi<UsuarioEntidad[]>>('/usuarios');
  return respuesta.data.datos;
};

/**
 * Envía una invitación por correo y registra un nuevo usuario en la plataforma.
 * Endpoint: POST /api/usuarios/invitar
 * 
 * @param datos Nombre completo y correo electrónico del usuario a invitar.
 * @returns Promesa con el usuario recién creado.
 */
export const invitarUsuarioApi = async (
  datos: InvitarUsuarioDatos
): Promise<UsuarioEntidad> => {
  const respuesta = await clienteAxios.post<RespuestaApi<UsuarioEntidad>>(
    '/usuarios/invitar',
    datos
  );
  return respuesta.data.datos;
};

/**
 * Modifica el rol de un usuario existente en la base de datos.
 * Endpoint: PATCH /api/usuarios/:id/rol
 * 
 * @param idUsuario Identificador UUID del usuario.
 * @param nuevoRol Rol a asignar ('solicitante' | 'soporte' | 'administrador').
 * @returns Promesa con el usuario actualizado.
 */
export const cambiarRolUsuarioApi = async (
  idUsuario: string,
  nuevoRol: RolUsuario
): Promise<UsuarioEntidad> => {
  const respuesta = await clienteAxios.patch<RespuestaApi<UsuarioEntidad>>(
    `/usuarios/${idUsuario}/rol`,
    { rol: nuevoRol }
  );
  return respuesta.data.datos;
};

/**
 * Desactiva un usuario en el sistema mediante baja lógica.
 * Endpoint: PATCH /api/usuarios/:id/desactivar
 * 
 * @param idUsuario Identificador UUID del usuario a desactivar.
 * @returns Promesa con el usuario desactivado.
 */
export const desactivarUsuarioApi = async (
  idUsuario: string
): Promise<UsuarioEntidad> => {
  const respuesta = await clienteAxios.patch<RespuestaApi<UsuarioEntidad>>(
    `/usuarios/${idUsuario}/desactivar`
  );
  return respuesta.data.datos;
};
