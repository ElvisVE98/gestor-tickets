/**
 * Enrutador de Usuarios
 * Define las rutas REST para la consulta de perfiles, listado de agentes de soporte
 * y administración de cuentas (invitaciones, roles y desactivaciones).
 */

import { Router } from 'express';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validarEsquema } from '../middlewares/validar-esquema.middleware';
import {
  esquemaInvitarUsuario,
  esquemaCambiarRolUsuario,
} from '../schemas/usuario.schema';
import {
  invitarUsuarioControlador,
  listarUsuariosControlador,
  cambiarRolUsuarioControlador,
  desactivarUsuarioControlador,
  obtenerPerfilUsuarioAutenticadoControlador,
  listarAgentesSoporteControlador,
} from '../controllers/usuario.controller';

const router = Router();

// ==========================================
// Rutas de Usuario Autenticado y Catálogos
// ==========================================

// GET /api/usuarios/yo - Obtener el perfil del usuario autenticado actual (cualquier rol activo)
router.get('/yo', autenticacionMiddleware, obtenerPerfilUsuarioAutenticadoControlador);

// GET /api/usuarios/agentes - Listar agentes activos disponibles para asignación de tickets (soporte y administrador)
router.get(
  '/agentes',
  autenticacionMiddleware,
  requiereRol('soporte', 'administrador'),
  listarAgentesSoporteControlador
);

// ==========================================
// Rutas Administrativas (Solo Administrador)
// ==========================================

// Middleware compuesto: todas las rutas siguientes requieren autenticación y rol 'administrador'
router.use(autenticacionMiddleware, requiereRol('administrador'));

// POST /api/usuarios/invitar - Invitar por correo electrónico y registrar nuevo usuario
router.post(
  '/invitar',
  validarEsquema(esquemaInvitarUsuario),
  invitarUsuarioControlador
);

// GET /api/usuarios - Listar la totalidad de usuarios registrados en el sistema
router.get('/', listarUsuariosControlador);

// PATCH /api/usuarios/:id/rol - Modificar el rol de un usuario existente
router.patch(
  '/:id/rol',
  validarEsquema(esquemaCambiarRolUsuario),
  cambiarRolUsuarioControlador
);

// PATCH /api/usuarios/:id/desactivar - Desactivar a un usuario en el sistema (baja lógica)
router.patch('/:id/desactivar', desactivarUsuarioControlador);

export const rutasUsuarios = router;
