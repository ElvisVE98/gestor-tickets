/**
 * Repositorio de Adjuntos
 * Capa de acceso a datos que gestiona tanto el almacenamiento físico de archivos en Supabase Storage
 * como la persistencia de sus metadatos en la tabla 'adjuntos_ticket'.
 */

import { clienteSupabase } from '../config/supabase';
import {
  AdjuntoEntidad,
  AdjuntoParaCrear,
  BUCKET_ADJUNTOS,
} from '../types/adjunto.type';

/**
 * Sube el búfer binario de un archivo al bucket de almacenamiento privado de Supabase Storage.
 * Se configura con `upsert: false` para asegurar que cada archivo tenga una ruta única y no sobrescriba existentes.
 * 
 * @param rutaArchivo Ruta relativa única dentro del bucket (ej. 'tickets/<ticketId>/<timestamp>-<nombre>').
 * @param buffer Búfer en memoria con el contenido del archivo.
 * @param tipoMime Tipo MIME del archivo para los encabezados Content-Type de descarga.
 * @returns Promesa con la ruta final guardada en el bucket.
 */
export const subirArchivoAStorage = async (
  rutaArchivo: string,
  buffer: Buffer,
  tipoMime: string
): Promise<string> => {
  const { data, error } = await clienteSupabase.storage
    .from(BUCKET_ADJUNTOS)
    .upload(rutaArchivo, buffer, {
      contentType: tipoMime,
      upsert: false,
    });

  if (error || !data) {
    throw new Error(
      `Error al subir el archivo a Supabase Storage: ${error?.message || 'Fallo desconocido'}`
    );
  }

  return data.path;
};

/**
 * Elimina un archivo de Supabase Storage.
 * Se utiliza principalmente como mecanismo de rollback o transacción compensatoria
 * en caso de que la inserción de metadatos en la base de datos falle tras haber subido el blob.
 * 
 * @param rutaArchivo Ruta del archivo a eliminar en el bucket.
 */
export const eliminarArchivoDeStorage = async (
  rutaArchivo: string
): Promise<void> => {
  const { error } = await clienteSupabase.storage
    .from(BUCKET_ADJUNTOS)
    .remove([rutaArchivo]);

  if (error) {
    console.error(
      `⚠️ Error durante la eliminación compensatoria en Storage (${rutaArchivo}):`,
      error.message
    );
  }
};

/**
 * Genera una URL firmada con tiempo de caducidad limitado para visualización o descarga segura.
 * Permite mantener el bucket privado y otorgar acceso temporal exclusivamente a usuarios autorizados.
 * 
 * @param rutaArchivo Ruta del archivo en el bucket.
 * @param segundosExpiracion Tiempo de validez de la URL en segundos (por defecto 300 = 5 minutos).
 * @returns Promesa con la URL firmada de descarga.
 */
export const generarUrlFirmada = async (
  rutaArchivo: string,
  segundosExpiracion: number = 300
): Promise<string> => {
  const { data, error } = await clienteSupabase.storage
    .from(BUCKET_ADJUNTOS)
    .createSignedUrl(rutaArchivo, segundosExpiracion);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Error al generar la URL firmada del archivo: ${error?.message || 'Sin URL generada'}`
    );
  }

  return data.signedUrl;
};

/**
 * Inserta un nuevo registro de metadatos de archivo adjunto en la tabla 'adjuntos_ticket'.
 * 
 * @param adjunto Datos del adjunto a registrar (ticket_id, nombre_archivo, ruta_storage, tamano_bytes, tipo_mime, subido_por).
 * @returns Promesa con la entidad del adjunto persistida.
 */
export const insertarAdjunto = async (
  adjunto: AdjuntoParaCrear
): Promise<AdjuntoEntidad> => {
  const { data, error } = await clienteSupabase
    .from('adjuntos_ticket')
    .insert(adjunto)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Error al guardar los metadatos del adjunto en la base de datos: ${error?.message || 'No se recibieron datos'}`
    );
  }

  return data as AdjuntoEntidad;
};

/**
 * Consulta todos los archivos adjuntos asociados a un ticket específico ordenados por fecha de subida ascendente.
 * 
 * @param idTicket Identificador UUID del ticket.
 * @returns Promesa con el listado de entidades de adjuntos vinculados.
 */
export const listarAdjuntosPorTicket = async (
  idTicket: string
): Promise<AdjuntoEntidad[]> => {
  const { data, error } = await clienteSupabase
    .from('adjuntos_ticket')
    .select('*')
    .eq('ticket_id', idTicket)
    .order('fecha_subida', { ascending: true });

  if (error) {
    throw new Error(
      `Error al listar los adjuntos del ticket de la base de datos: ${error.message}`
    );
  }

  return (data || []) as AdjuntoEntidad[];
};

/**
 * Consulta un archivo adjunto específico por su ID verificando que pertenezca al ticket indicado.
 * 
 * Decisión técnica: Se utiliza `.maybeSingle()` para verificar la pertenencia y retornar `null`
 * si no existe o no corresponde a ese ticket, permitiendo retornar 404 de manera controlada.
 * 
 * @param idAdjunto Identificador UUID del adjunto.
 * @param idTicket Identificador UUID del ticket al que debe pertenecer.
 * @returns Promesa con la entidad del adjunto o `null` si no coincide.
 */
export const obtenerAdjuntoPorId = async (
  idAdjunto: string,
  idTicket: string
): Promise<AdjuntoEntidad | null> => {
  const { data, error } = await clienteSupabase
    .from('adjuntos_ticket')
    .select('*')
    .eq('id', idAdjunto)
    .eq('ticket_id', idTicket)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error al consultar el adjunto en la base de datos: ${error.message}`
    );
  }

  return data as AdjuntoEntidad | null;
};
