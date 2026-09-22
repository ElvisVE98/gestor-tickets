/**
 * Enrutador de Tickets
 * Define las rutas REST del módulo de tickets, integrando middlewares de autenticación,
 * autorización por roles, validación de esquemas Zod y subida de archivos binarios.
 */

import { Router } from 'express';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validarEsquema } from '../middlewares/validar-esquema.middleware';
import { subirArchivoMiddleware } from '../middlewares/subida-archivo.middleware';
import {
  esquemaCrearTicket,
  esquemaCambiarEstadoTicket,
  esquemaAsignarTicket,
} from '../schemas/ticket.schema';
import { esquemaCrearComentario } from '../schemas/comentario.schema';
import {
  crearTicketControlador,
  listarTicketsControlador,
  obtenerTicketPorIdControlador,
  cambiarEstadoTicketControlador,
  asignarTicketControlador,
  listarHistorialTicketControlador,
  obtenerMetricasTicketsControlador,
} from '../controllers/ticket.controller';
import {
  crearComentarioControlador,
  listarComentariosControlador,
} from '../controllers/comentario.controller';
import {
  subirAdjuntoControlador,
  listarAdjuntosControlador,
  descargarAdjuntoControlador,
} from '../controllers/adjunto.controller';

const router = Router();

// ==========================================
// Rutas Principales de Tickets
// ==========================================

// GET /api/tickets - Listar tickets accesibles según el rol del usuario autenticado
router.get('/', autenticacionMiddleware, listarTicketsControlador);

// GET /api/tickets/metricas - Obtener conteos de KPIs de la mesa de ayuda (restringido a 'soporte' y 'administrador')
router.get(
  '/metricas',
  autenticacionMiddleware,
  requiereRol('soporte', 'administrador'),
  obtenerMetricasTicketsControlador
);

// GET /api/tickets/:id - Obtener el detalle de un ticket específico
router.get('/:id', autenticacionMiddleware, obtenerTicketPorIdControlador);

// POST /api/tickets - Crear un nuevo ticket (disponible para cualquier rol autenticado y activo)
router.post(
  '/',
  autenticacionMiddleware,
  validarEsquema(esquemaCrearTicket),
  crearTicketControlador
);

// PATCH /api/tickets/:id/estado - Cambiar el estado del ticket (restringido a roles 'soporte' y 'administrador')
router.patch(
  '/:id/estado',
  autenticacionMiddleware,
  requiereRol('soporte', 'administrador'),
  validarEsquema(esquemaCambiarEstadoTicket),
  cambiarEstadoTicketControlador
);

// PATCH /api/tickets/:id/asignacion - Asignar o desasignar técnico (restringido a roles 'soporte' y 'administrador')
router.patch(
  '/:id/asignacion',
  autenticacionMiddleware,
  requiereRol('soporte', 'administrador'),
  validarEsquema(esquemaAsignarTicket),
  asignarTicketControlador
);

// ==========================================
// Rutas de Historial de Cambios de Estado
// ==========================================

// GET /api/tickets/:id/historial - Listar historial cronológico de auditoría del ticket
router.get(
  '/:id/historial',
  autenticacionMiddleware,
  listarHistorialTicketControlador
);

// ==========================================
// Rutas de Comentarios (Sub-recursos de Tickets)
// ==========================================

// POST /api/tickets/:id/comentarios - Agregar un nuevo comentario al hilo del ticket
router.post(
  '/:id/comentarios',
  autenticacionMiddleware,
  validarEsquema(esquemaCrearComentario),
  crearComentarioControlador
);

// GET /api/tickets/:id/comentarios - Listar comentarios del ticket en orden cronológico
router.get(
  '/:id/comentarios',
  autenticacionMiddleware,
  listarComentariosControlador
);

// ==========================================
// Rutas de Archivos Adjuntos (Sub-recursos de Tickets)
// ==========================================

// POST /api/tickets/:id/adjuntos - Subir archivo adjunto (multipart/form-data con campo 'archivo', máx 5 MB)
router.post(
  '/:id/adjuntos',
  autenticacionMiddleware,
  subirArchivoMiddleware,
  subirAdjuntoControlador
);

// GET /api/tickets/:id/adjuntos - Listar metadatos de archivos adjuntos vinculados al ticket
router.get(
  '/:id/adjuntos',
  autenticacionMiddleware,
  listarAdjuntosControlador
);

// GET /api/tickets/:id/adjuntos/:idAdjunto/descargar - Obtener URL temporal prefirmada de descarga (5 min)
router.get(
  '/:id/adjuntos/:idAdjunto/descargar',
  autenticacionMiddleware,
  descargarAdjuntoControlador
);

export const rutasTickets = router;
