/**
 * Esquemas de validación Zod para gestión de contraseñas y recuperación de cuentas.
 * Define las reglas de formato para establecer nuevas credenciales y solicitar links de restablecimiento.
 */

import { z } from 'zod';

/**
 * Esquema de validación para establecer o restablecer la contraseña de un usuario.
 * Exige una longitud mínima de 6 caracteres y valida que ambas contraseñas coincidan exactamente.
 */
export const esquemaEstablecerPassword = z
  .object({
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmar_password: z
      .string()
      .min(1, 'Por favor confirma tu contraseña'),
  })
  .refine((datos) => datos.password === datos.confirmar_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar_password'],
  });

/**
 * Tipo inferido de TypeScript para los valores del formulario de nueva contraseña.
 */
export type EstablecerPasswordEntrada = z.infer<typeof esquemaEstablecerPassword>;

/**
 * Esquema de validación para la solicitud de restablecimiento de contraseña por correo.
 */
export const esquemaRecuperarPassword = z.object({
  correo_electronico: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un formato de correo válido (ej: usuario@curifor.com)'),
});

/**
 * Tipo inferido de TypeScript para la solicitud de recuperación de contraseña.
 */
export type RecuperarPasswordEntrada = z.infer<typeof esquemaRecuperarPassword>;
