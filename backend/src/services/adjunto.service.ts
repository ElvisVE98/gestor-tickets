/**
 * Servicio de Adjuntos
 * Capa de lógica de negocio para el procesamiento de archivos adjuntos,
 * subida física a Supabase Storage, transacciones compensatorias y generación de URLs firmadas.
 */

import {
  eliminarArchivoDeStorage,
  generarUrlFirmada,
  insertarAdjunto,
  listarAdjuntosPorTicket,
  obtenerAdjuntoPorId,
  subirArchivoAStorage,
} from '../repositories/adjunto.repository';
import { obtenerTicketPorIdServicio } from './ticket.service';
import { AdjuntoEntidad, AdjuntoParaCrear } from '../types/adjunto.type';
import { RolUsuario } from '../types/usuario.type';
import { ErrorApp, ErrorNoEncontrado } from '../errors/app.error';

/**
 * Procesa la carga de un archivo adjunto vinculado a un ticket.
 * 
 * Flujo y decisiones de diseño:
 * 1. Valida que el archivo binario esté presente en la solicitud (procesado previamente por Multer).
 * 2. Valida la existencia y visibilidad del ticket reutilizando `obtenerTicketPorIdServicio`.
 * 3. Sanitiza el nombre original del archivo eliminando caracteres especiales potencialmente problemáticos.
 * 4. Genera una ruta con prefijo del ID de ticket y timestamp para garantizar unicidad y evitar colisiones.
 * 5. Sube el búfer a Supabase Storage en el bucket privado.
 * 6. Registra los metadatos en la tabla 'adjuntos_ticket'. Si la base de datos falla, se ejecuta
 *    una transacción compensatoria inmediata eliminando el blob de Storage (`eliminarArchivoDeStorage`)
 *    para evitar el almacenamiento de archivos huérfanos.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param archivo Objeto de archivo procesado por Multer (`Express.Multer.File`).
 * @param idUsuario Identificador UUID del usuario autenticado que sube el archivo.
 * @param rol Rol del usuario autenticado.
 * @returns Promesa con la entidad del adjunto persistida.
 */
export const subirAdjuntoServicio = async (
  idTicket: string,
  archivo: Express.Multer.File | undefined,
  idUsuario: string,
  rol: RolUsuario
): Promise<AdjuntoEntidad> => {
  // 1. Validar que el archivo haya sido recibido
  if (!archivo) {
    throw new ErrorApp('No se proporcionó ningún archivo para subir', 400);
  }

  // 2. Validar que el ticket exista y que el usuario tenga acceso (reutilización DRY)
  await obtenerTicketPorIdServicio(idTicket, idUsuario, rol);

  // 3. Limpiar y normalizar el nombre del archivo para generar una ruta única en Storage
  const nombreLimpio = archivo.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const rutaEnStorage = `${idTicket}/${Date.now()}_${nombreLimpio}`;

  // 4. Subir el binario a Supabase Storage
  const rutaFinal = await subirArchivoAStorage(
    rutaEnStorage,
    archivo.buffer,
    archivo.mimetype
  );

  // 5. Preparar el registro para la base de datos
  const nuevoAdjunto: AdjuntoParaCrear = {
    ticket_id: idTicket,
    subido_por_id: idUsuario,
    nombre_archivo: archivo.originalname,
    ruta_archivo: rutaFinal,
    tipo_archivo: archivo.mimetype,
    tamano_bytes: archivo.size,
  };

  // 6. Insertar metadatos en la base de datos con rollback de compensación en caso de error
  try {
    return await insertarAdjunto(nuevoAdjunto);
  } catch (errorDb) {
    // Si la base de datos falla, eliminamos el archivo subido a Storage para evitar basura
    await eliminarArchivoDeStorage(rutaFinal);
    throw errorDb;
  }
};

/**
 * Consulta todos los archivos adjuntos vinculados a un ticket.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idUsuario Identificador UUID del usuario consultante.
 * @param rol Rol del usuario autenticado.
 * @returns Promesa con el listado de adjuntos.
 */
export const listarAdjuntosServicio = async (
  idTicket: string,
  idUsuario: string,
  rol: RolUsuario
): Promise<AdjuntoEntidad[]> => {
  // 1. Validar que el ticket exista y que el usuario tenga acceso (reutilización DRY)
  await obtenerTicketPorIdServicio(idTicket, idUsuario, rol);

  // 2. Retornar la lista de adjuntos
  return await listarAdjuntosPorTicket(idTicket);
};

/**
 * Genera una URL temporal prefirmada para descargar o previsualizar de forma segura un archivo adjunto.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @param idAdjunto Identificador UUID del adjunto.
 * @param idUsuario Identificador UUID del usuario consultante.
 * @param rol Rol del usuario autenticado.
 * @returns Promesa con la URL firmada (validez de 5 minutos).
 */
export const generarUrlDescargaAdjuntoServicio = async (
  idTicket: string,
  idAdjunto: string,
  idUsuario: string,
  rol: RolUsuario
): Promise<string> => {
  // 1. Validar que el ticket exista y que el usuario tenga acceso (reutilización DRY)
  await obtenerTicketPorIdServicio(idTicket, idUsuario, rol);

  // 2. Consultar el archivo adjunto específico en la base de datos
  const adjunto = await obtenerAdjuntoPorId(idAdjunto, idTicket);

  if (!adjunto) {
    throw new ErrorNoEncontrado('Adjunto no encontrado');
  }

  // 3. Generar la URL firmada por 300 segundos (5 minutos)
  return await generarUrlFirmada(adjunto.ruta_archivo, 300);
};
