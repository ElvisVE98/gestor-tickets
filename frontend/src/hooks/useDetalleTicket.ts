/**
 * Hook Personalizado: useDetalleTicket
 * Gestiona la carga concurrente y el estado reactivo del detalle de un ticket,
 * incluyendo su hilo de comentarios, lista de adjuntos e historial de auditoría.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  obtenerTicketPorIdApi,
  listarComentariosApi,
  listarAdjuntosApi,
  listarHistorialApi,
} from '@/api/tickets.api';
import {
  TicketEntidad,
  ComentarioEntidad,
  AdjuntoEntidad,
  HistorialTicketEntidad,
} from '@/types/ticket.type';

export interface UseDetalleTicketRetorno {
  ticket: TicketEntidad | null;
  comentarios: ComentarioEntidad[];
  adjuntos: AdjuntoEntidad[];
  historial: HistorialTicketEntidad[];
  cargando: boolean;
  error: string | null;
  recargarTodo: () => Promise<void>;
  recargarTicket: () => Promise<void>;
  recargarComentarios: () => Promise<void>;
  recargarAdjuntos: () => Promise<void>;
  recargarHistorial: () => Promise<void>;
}

/**
 * Hook para cargar y sincronizar los datos completos de un ticket específico.
 * 
 * Decisión de diseño: Provee métodos de recarga granular independientes (`recargarTicket`,
 * `recargarComentarios`, `recargarAdjuntos`, `recargarHistorial`) además de `recargarTodo`.
 * Esto permite que las acciones secundarias (como enviar un comentario o subir un archivo adjunto)
 * actualicen únicamente la lista correspondiente sin necesidad de re-renderizar o refetchear
 * todas las secciones del ticket.
 * 
 * @param idTicket Identificador UUID del ticket a consultar.
 * @returns Estados de datos, banderas de carga, error y funciones de recarga granular.
 */
export function useDetalleTicket(idTicket?: string): UseDetalleTicketRetorno {
  const [ticket, setTicket] = useState<TicketEntidad | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioEntidad[]>([]);
  const [adjuntos, setAdjuntos] = useState<AdjuntoEntidad[]>([]);
  const [historial, setHistorial] = useState<HistorialTicketEntidad[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /** Recarga únicamente los datos base del ticket y sus relaciones de asignación */
  const recargarTicket = useCallback(async () => {
    if (!idTicket) return;
    try {
      const data = await obtenerTicketPorIdApi(idTicket);
      setTicket(data);
    } catch (err: any) {
      console.error('Error al recargar ticket:', err);
    }
  }, [idTicket]);

  /** Recarga únicamente el listado de comentarios del hilo */
  const recargarComentarios = useCallback(async () => {
    if (!idTicket) return;
    try {
      const data = await listarComentariosApi(idTicket);
      setComentarios(data);
    } catch (err: any) {
      console.error('Error al recargar comentarios:', err);
    }
  }, [idTicket]);

  /** Recarga únicamente el listado de archivos adjuntos */
  const recargarAdjuntos = useCallback(async () => {
    if (!idTicket) return;
    try {
      const data = await listarAdjuntosApi(idTicket);
      setAdjuntos(data);
    } catch (err: any) {
      console.error('Error al recargar adjuntos:', err);
    }
  }, [idTicket]);

  /** Recarga únicamente los eventos de historial de auditoría */
  const recargarHistorial = useCallback(async () => {
    if (!idTicket) return;
    try {
      const data = await listarHistorialApi(idTicket);
      setHistorial(data);
    } catch (err: any) {
      console.error('Error al recargar historial:', err);
    }
  }, [idTicket]);

  /** Carga inicial concurrente de todas las fuentes de datos del ticket mediante Promise.all */
  const recargarTodo = useCallback(async () => {
    if (!idTicket) return;
    setCargando(true);
    setError(null);

    try {
      const [ticketData, comentariosData, adjuntosData, historialData] =
        await Promise.all([
          obtenerTicketPorIdApi(idTicket),
          listarComentariosApi(idTicket),
          listarAdjuntosApi(idTicket),
          listarHistorialApi(idTicket),
        ]);

      setTicket(ticketData);
      setComentarios(comentariosData);
      setAdjuntos(adjuntosData);
      setHistorial(historialData);
    } catch (err: any) {
      console.error('Error al cargar detalle del ticket:', err);
      const mensaje =
        err?.response?.data?.mensaje ||
        err?.message ||
        'No fue posible obtener la información del ticket.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [idTicket]);

  useEffect(() => {
    recargarTodo();
  }, [recargarTodo]);

  return {
    ticket,
    comentarios,
    adjuntos,
    historial,
    cargando,
    error,
    recargarTodo,
    recargarTicket,
    recargarComentarios,
    recargarAdjuntos,
    recargarHistorial,
  };
}
