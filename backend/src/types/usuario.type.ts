/**
 * Definiciones de tipos y constantes para el dominio de Usuarios.
 * Modela las entidades de base de datos, roles y representaciones en sesión HTTP.
 */

// Arreglo constante inmutable: fuente única de verdad para roles de usuario
export const ROLES_USUARIO = ['solicitante', 'soporte', 'administrador'] as const;

// Tipo TypeScript derivado: 'solicitante' | 'soporte' | 'administrador'
export type RolUsuario = (typeof ROLES_USUARIO)[number];

// Estructura del usuario autenticado que se adjunta a la petición HTTP tras superar el middleware
export interface UsuarioAutenticado {
  id: string;
  nombre_completo: string;
  rol: RolUsuario;
}

// Estructura simplificada para agentes de soporte y administradores activos
export interface AgenteSoporteEntidad {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: RolUsuario;
}

// Estructura completa del registro en la tabla 'usuarios'
export interface UsuarioEntidad {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: RolUsuario;
  activo: boolean;
  fecha_creacion: string;
  fecha_desvinculacion?: string | null;
}

// Estructura para la inserción de un usuario nuevo en la tabla
export interface UsuarioParaCrear {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: RolUsuario;
  activo: boolean;
}
