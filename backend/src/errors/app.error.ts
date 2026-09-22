/**
 * Jerarquía de errores operacionales y controlados de la aplicación.
 * Permite distinguir errores de negocio (con código HTTP específico) de errores inesperados del sistema.
 */

/**
 * Clase base para errores controlados de la aplicación.
 * @param mensaje - Mensaje descriptivo del error para el cliente.
 * @param codigoEstado - Código de estado HTTP (por defecto 400 Bad Request).
 */
export class ErrorApp extends Error {
  public readonly codigoEstado: number;

  constructor(mensaje: string, codigoEstado: number = 400) {
    super(mensaje);
    this.name = 'ErrorApp';
    this.codigoEstado = codigoEstado;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error específico para recursos no encontrados o sin permisos de visibilidad para el usuario (404 Not Found).
 * @param mensaje - Mensaje opcional personalizado (por defecto 'Recurso no encontrado').
 */
export class ErrorNoEncontrado extends ErrorApp {
  constructor(mensaje: string = 'Recurso no encontrado') {
    super(mensaje, 404);
    this.name = 'ErrorNoEncontrado';
  }
}
