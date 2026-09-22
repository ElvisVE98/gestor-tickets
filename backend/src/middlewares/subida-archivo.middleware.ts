/**
 * Middleware de Subida de Archivos
 * Capa encargada de procesar peticiones multipart/form-data, validar límites de tamaño (5 MB),
 * filtrar extensiones permitidas (PDF e imágenes) y cargar el búfer en memoria RAM con Multer.
 */

import { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import {
  TAMANO_MAXIMO_ADJUNTO_BYTES,
  TIPOS_MIME_PERMITIDOS,
} from '../types/adjunto.type';
import { ErrorApp } from '../errors/app.error';

/**
 * Configuración de almacenamiento en memoria RAM.
 * Mantiene el archivo como un `Buffer` en memoria para retransmitirlo inmediatamente
 * a Supabase Storage sin necesidad de escribir archivos temporales en el disco del servidor.
 */
const almacenamientoEnMemoria = multer.memoryStorage();

/**
 * Filtro de validación para tipos MIME permitidos.
 * Restringe la subida únicamente a imágenes (JPEG, PNG, WEBP) y documentos PDF.
 */
const filtroArchivo = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  const esTipoPermitido = (TIPOS_MIME_PERMITIDOS as readonly string[]).includes(
    file.mimetype
  );

  if (esTipoPermitido) {
    callback(null, true);
  } else {
    callback(
      new ErrorApp(
        'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) y documentos PDF.',
        400
      )
    );
  }
};

/**
 * Instancia base de Multer configurada para un único archivo en el campo 'archivo'.
 */
const cargadorMulter = multer({
  storage: almacenamientoEnMemoria,
  limits: {
    fileSize: TAMANO_MAXIMO_ADJUNTO_BYTES,
  },
  fileFilter: filtroArchivo,
}).single('archivo');

/**
 * Middleware de Express para la captura y validación de archivos adjuntos.
 * 
 * Flujo y decisiones de diseño:
 * 1. Ejecuta Multer y captura excepciones de límite de tamaño (`LIMIT_FILE_SIZE`).
 * 2. Si ocurre un error de validación MIME (`ErrorApp`), responde con código 400.
 * 3. Corrige el encoding del nombre de archivo (`Buffer.from(..., 'latin1').toString('utf8')`)
 *    para preservar tildes, ñ y caracteres especiales que Multer interpreta en latin1 por defecto.
 * 4. Pasa el archivo procesado en `req.file` al controlador.
 * 
 * @param req Petición HTTP Express.
 * @param res Respuesta HTTP Express.
 * @param next Función middleware de continuación.
 */
export const subirArchivoMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  cargadorMulter(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          exito: false,
          mensaje: 'El archivo excede el tamaño máximo permitido de 5 MB',
        });
      }
      return res.status(400).json({
        exito: false,
        mensaje: `Error en la subida del archivo: ${error.message}`,
      });
    }

    if (error instanceof ErrorApp) {
      return res.status(error.codigoEstado).json({
        exito: false,
        mensaje: error.message,
      });
    }

    if (error) {
      return next(error);
    }

    // Corrección de encoding en el nombre original del archivo (Multer multipart/form-data)
    if (req.file) {
      req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    }

    return next();
  });
};
