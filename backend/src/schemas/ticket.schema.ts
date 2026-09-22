/**
 * Esquemas de validación Zod para peticiones HTTP del dominio de Tickets.
 * Valida creación, filtros de consulta, transiciones de estado y asignación de técnicos.
 */

import { z } from 'zod';
import { CATEGORIAS_TICKET, PRIORIDADES_TICKET, ESTADOS_TICKET } from '../types/ticket.type';

// Esquema Zod para la creación de un nuevo ticket desde el cliente HTTP
export const esquemaCrearTicket = z.object({
  titulo: z
    .string({
      required_error: 'El título es obligatorio',
      invalid_type_error: 'El título debe ser una cadena de texto',
    })
    .trim()
    .min(5, { message: 'El título debe tener al menos 5 caracteres' })
    .max(150, { message: 'El título no puede exceder los 150 caracteres' }),

  descripcion: z
    .string({
      required_error: 'La descripción es obligatoria',
      invalid_type_error: 'La descripción debe ser una cadena de texto',
    })
    .trim()
    .min(10, { message: 'La descripción debe tener al menos 10 caracteres' }),

  categoria: z.enum(CATEGORIAS_TICKET, {
    errorMap: () => ({
      message:
        'La categoría debe ser una de las siguientes: erp_flexline, rindegasto, soporte_ti, solicitud_desarrollo, otro',
    }),
  }),

  prioridad: z
    .enum(PRIORIDADES_TICKET, {
      errorMap: () => ({
        message: 'La prioridad debe ser: baja, media, alta o urgente',
      }),
    })
    .default('media'),
});

// Esquema Zod para cambiar el estado de un ticket en su ciclo de vida
export const esquemaCambiarEstadoTicket = z.object({
  estado: z.enum(ESTADOS_TICKET, {
    errorMap: () => ({
      message: 'El estado debe ser: abierto, en_progreso, resuelto o cerrado',
    }),
  }),
});

// Esquema Zod para asignar o desasignar (con null) un ticket a un agente técnico
export const esquemaAsignarTicket = z.object({
  asignado_a_id: z
    .string({
      required_error: 'El campo asignado_a_id es requerido (puede ser UUID o null)',
    })
    .uuid({
      message: 'El identificador asignado_a_id debe ser un UUID válido',
    })
    .nullable(),
});

// Esquema Zod para sanitizar y validar los query params en el listado de tickets
export const esquemaFiltrosTicket = z.object({
  estado: z.enum(ESTADOS_TICKET).optional(),
  categoria: z.enum(CATEGORIAS_TICKET).optional(),
  prioridad: z.enum(PRIORIDADES_TICKET).optional(),
  asignado: z.enum(['asignado', 'sin_asignar']).optional(),
  buscar: z.string().trim().min(1).optional(),
  pagina: z.coerce.number().int().min(1, 'La página mínima es 1').default(1),
  limite: z.coerce
    .number()
    .int()
    .min(1, 'El límite mínimo es 1')
    .max(100, 'El límite máximo permitido es 100')
    .default(20),
});

// Tipos inferidos automáticamente a partir de los esquemas Zod
export type CrearTicketEntrada = z.infer<typeof esquemaCrearTicket>;
export type CambiarEstadoTicketEntrada = z.infer<typeof esquemaCambiarEstadoTicket>;
export type AsignarTicketEntrada = z.infer<typeof esquemaAsignarTicket>;
export type FiltrosTicketEntrada = z.infer<typeof esquemaFiltrosTicket>;
