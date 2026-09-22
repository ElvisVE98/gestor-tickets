/**
 * Declaraciones de tipos globales para Express.
 * Extiende la interfaz Request de Express para incluir la propiedad opcional usuario.
 */

import { UsuarioAutenticado } from './usuario.type';

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}
