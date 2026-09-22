/**
 * Esquemas de validación Zod para peticiones HTTP del dominio de Usuarios.
 * Define reglas de negocio para invitación de colaboradores y modificación de roles.
 */

import { z } from 'zod';
import { ROLES_USUARIO } from '../types/usuario.type';

// Esquema Zod para validar la invitación y registro de un nuevo usuario
export const esquemaInvitarUsuario = z.object({
  nombre_completo: z
    .string({
      required_error: 'El nombre completo es obligatorio',
      invalid_type_error: 'El nombre completo debe ser una cadena de texto',
    })
    .trim()
    .min(3, { message: 'El nombre completo debe tener al menos 3 caracteres' })
    .max(100, { message: 'El nombre completo no puede exceder los 100 caracteres' }),

  correo_electronico: z
    .string({
      required_error: 'El correo electrónico es obligatorio',
    })
    .trim()
    .email({ message: 'El formato del correo electrónico no es válido' })
    .refine(
      (correo) => {
        const correoMin = correo.toLowerCase();
        return correoMin.endsWith('@curifor.com') || correoMin.endsWith('@prueba.com');
      },
      {
        message: 'El correo electrónico debe pertenecer al dominio @curifor.com o @prueba.com',
      }
    ),
});

// Esquema Zod para validar la modificación del rol de un usuario existente
export const esquemaCambiarRolUsuario = z.object({
  rol: z.enum(ROLES_USUARIO, {
    errorMap: () => ({
      message: 'El rol debe ser: solicitante, soporte o administrador',
    }),
  }),
});

// Tipos inferidos automáticamente a partir de los esquemas Zod
export type InvitarUsuarioEntrada = z.infer<typeof esquemaInvitarUsuario>;
export type CambiarRolUsuarioEntrada = z.infer<typeof esquemaCambiarRolUsuario>;
