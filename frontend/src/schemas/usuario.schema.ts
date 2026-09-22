/**
 * Esquema de Validación: Invitación de Usuarios
 * Define las reglas de validación en el cliente para el formulario de invitación y alta de cuentas.
 */

import { z } from 'zod';

/**
 * Esquema Zod para validación de datos en el modal de invitación de nuevos usuarios.
 */
export const esquemaInvitarUsuario = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  correo_electronico: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingresa un formato de correo electrónico válido'),
});

export type InvitarUsuarioEntrada = z.infer<typeof esquemaInvitarUsuario>;
