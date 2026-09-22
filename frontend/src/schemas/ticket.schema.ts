/**
 * Esquema de Validación: Creación de Tickets
 * Define las reglas de validación en el cliente para el formulario de emisión de tickets.
 */

import { z } from 'zod';
import { CATEGORIAS_TICKET, PRIORIDADES_TICKET } from '@/types/ticket.type';

/**
 * Esquema Zod para validación de datos en el formulario de creación de tickets.
 */
export const esquemaCrearTicket = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(150, 'El título no puede exceder los 150 caracteres'),
  descripcion: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  categoria: z.enum(CATEGORIAS_TICKET, {
    message: 'Selecciona una categoría válida',
  }),
  prioridad: z.enum(PRIORIDADES_TICKET, {
    message: 'Selecciona una prioridad válida',
  }),
});

export type CrearTicketEntrada = z.infer<typeof esquemaCrearTicket>;
