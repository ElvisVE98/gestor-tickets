/**
 * Esquemas de validación Zod para peticiones HTTP del dominio de Comentarios.
 * Valida el cuerpo de la petición al registrar respuestas o notas en un ticket.
 */

import { z } from 'zod';

// Esquema Zod para validar el contenido textual de un comentario
export const esquemaCrearComentario = z.object({
  contenido: z
    .string({
      required_error: 'El contenido del comentario es obligatorio',
      invalid_type_error: 'El contenido debe ser una cadena de texto',
    })
    .trim()
    .min(1, { message: 'El comentario no puede estar vacío' })
    .max(2000, { message: 'El comentario no puede exceder los 2000 caracteres' }),
});

// Tipo inferido automáticamente a partir del esquema Zod
export type CrearComentarioEntrada = z.infer<typeof esquemaCrearComentario>;
