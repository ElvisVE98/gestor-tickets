/**
 * Esquema de Validación: Inicio de Sesión
 * Define las reglas de validación en el cliente para el formulario de autenticación.
 */

import { z } from 'zod';

/**
 * Esquema Zod para validación de credenciales en el formulario de inicio de sesión.
 */
export const esquemaLogin = z.object({
  correo_electronico: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico corporativo válido'),
  contrasena: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export type LoginEntrada = z.infer<typeof esquemaLogin>;
