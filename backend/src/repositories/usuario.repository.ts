/**
 * Repositorio de Usuarios
 * Capa de acceso a datos que interactúa directamente con la tabla 'usuarios' en Supabase.
 */

import { clienteSupabase } from '../config/supabase';
import {
  UsuarioEntidad,
  UsuarioParaCrear,
  RolUsuario,
  AgenteSoporteEntidad,
} from '../types/usuario.type';

/**
 * Inserta un nuevo perfil de usuario en la tabla 'usuarios'.
 * 
 * @param usuario Objeto con los datos iniciales del usuario (id, correo, nombre, rol, activo).
 * @returns Promesa con la entidad del usuario recién insertada.
 */
export const insertarUsuario = async (
  usuario: UsuarioParaCrear
): Promise<UsuarioEntidad> => {
  const { data, error } = await clienteSupabase
    .from('usuarios')
    .insert(usuario)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Error al insertar el usuario en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as UsuarioEntidad;
};

/**
 * Obtiene la lista completa de todos los usuarios registrados en el sistema.
 * Los registros se ordenan de forma descendente según su fecha de creación.
 * 
 * @returns Promesa con el arreglo de todas las entidades de usuario.
 */
export const listarUsuarios = async (): Promise<UsuarioEntidad[]> => {
  const { data, error } = await clienteSupabase
    .from('usuarios')
    .select('*')
    .order('fecha_creacion', { ascending: false });

  if (error) {
    throw new Error(`Error al listar los usuarios de la base de datos: ${error.message}`);
  }

  return (data || []) as UsuarioEntidad[];
};

/**
 * Consulta un usuario en la base de datos por su identificador único UUID.
 * 
 * Decisión técnica: Se utiliza `.maybeSingle()` en lugar de `.single()` para evitar
 * que el cliente de Supabase lance una excepción si el usuario no existe. De este modo,
 * retorna `null` de forma limpia y predecible para que el servicio maneje el error 404.
 * 
 * @param idUsuario Identificador UUID del usuario.
 * @returns Promesa con la entidad del usuario encontrada o `null` si no existe.
 */
export const obtenerUsuarioPorId = async (
  idUsuario: string
): Promise<UsuarioEntidad | null> => {
  const { data, error } = await clienteSupabase
    .from('usuarios')
    .select('*')
    .eq('id', idUsuario)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al consultar el usuario en la base de datos: ${error.message}`);
  }

  return data as UsuarioEntidad | null;
};

/**
 * Actualiza el rol de permisos de un usuario específico en la base de datos.
 * 
 * @param idUsuario Identificador UUID del usuario a modificar.
 * @param nuevoRol Nuevo rol asignado ('solicitante' | 'soporte' | 'administrador').
 * @returns Promesa con la entidad de usuario actualizada.
 */
export const actualizarRolUsuario = async (
  idUsuario: string,
  nuevoRol: RolUsuario
): Promise<UsuarioEntidad> => {
  const { data, error } = await clienteSupabase
    .from('usuarios')
    .update({ rol: nuevoRol })
    .eq('id', idUsuario)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Error al actualizar el rol del usuario en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as UsuarioEntidad;
};

/**
 * Desactiva un usuario en el sistema estableciendo activo en false y guardando
 * la marca de tiempo de la desvinculación para auditoría.
 * 
 * @param idUsuario Identificador UUID del usuario a desactivar.
 * @param fechaDesvinculacion Fecha y hora ISO en que se efectúa la desvinculación.
 * @returns Promesa con la entidad de usuario actualizada.
 */
export const desactivarUsuario = async (
  idUsuario: string,
  fechaDesvinculacion: string
): Promise<UsuarioEntidad> => {
  const { data, error } = await clienteSupabase
    .from('usuarios')
    .update({
      activo: false,
      fecha_desvinculacion: fechaDesvinculacion,
    })
    .eq('id', idUsuario)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Error al desactivar el usuario en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as UsuarioEntidad;
};

/**
 * Obtiene la lista de usuarios activos capacitados para atender tickets (roles 'soporte' y 'administrador').
 * Se utiliza para poblar los selectores de asignación en la gestión de tickets.
 * 
 * @returns Promesa con la lista de agentes disponibles ordenada alfabéticamente por nombre.
 */
export const listarAgentesSoporte = async (): Promise<AgenteSoporteEntidad[]> => {
  const { data, error } = await clienteSupabase
    .from('usuarios')
    .select('id, nombre_completo, correo_electronico, rol')
    .eq('activo', true)
    .in('rol', ['soporte', 'administrador'])
    .order('nombre_completo', { ascending: true });

  if (error) {
    throw new Error(`Error al listar los agentes de soporte: ${error.message}`);
  }

  return (data || []) as AgenteSoporteEntidad[];
};
