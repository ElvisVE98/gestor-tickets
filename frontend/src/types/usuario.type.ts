/**
 * Definiciones de Tipos: Módulo de Usuarios
 * Modela perfiles de usuario, roles de acceso, entidades de usuarios y respuestas de API.
 */

/** Arreglo constante inmutable de roles de usuario */
export const ROLES_USUARIO = ['solicitante', 'soporte', 'administrador'] as const;

/** Tipo derivado de los roles posibles */
export type RolUsuario = (typeof ROLES_USUARIO)[number];

/** Perfil de usuario devuelto por GET /api/usuarios/yo para la sesión activa */
export interface PerfilUsuario {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: RolUsuario;
  activo: boolean;
}

/** Entidad completa de usuario persistida en la base de datos */
export interface UsuarioEntidad {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: RolUsuario;
  activo: boolean;
  fecha_creacion: string;
  fecha_desvinculacion?: string | null;
}

/** Estructura simplificada para agentes de soporte y administradores en selectores */
export interface AgenteSoporte {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: RolUsuario;
}

/** Datos requeridos para invitar a un nuevo usuario */
export interface InvitarUsuarioDatos {
  nombre_completo: string;
  correo_electronico: string;
}

/** Estructura estándar de respuesta JSON del backend */
export interface RespuestaApi<T> {
  exito: boolean;
  mensaje: string;
  datos: T;
}
