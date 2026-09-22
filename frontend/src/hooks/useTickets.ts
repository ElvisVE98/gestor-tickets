/**
 * Hook Personalizado: useTickets
 * Encapsula la obtención reactiva del listado paginado de tickets y la sincronización con los filtros de búsqueda.
 */

import { useState, useEffect, useCallback } from 'react';
import { listarTicketsApi } from '@/api/tickets.api';
import { TicketEntidad, FiltrosListarTickets } from '@/types/ticket.type';

export interface UseTicketsRetorno {
  tickets: TicketEntidad[];
  cargando: boolean;
  error: string | null;
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  cambiarPagina: (nuevaPagina: number) => void;
  recargar: () => Promise<void>;
}

/**
 * Hook para consultar y filtrar tickets de forma paginada según el rol y criterios activos.
 * 
 * @param filtros Criterios opcionales de filtrado (estado, categoría, prioridad, asignación, texto de búsqueda).
 * @param limitePorDefecto Cantidad de registros por página (por defecto 20).
 * @returns Lista de tickets, metadatos de paginación, indicadores de carga y error, y funciones de control.
 */
export function useTickets(
  filtros?: FiltrosListarTickets,
  limitePorDefecto: number = 15
): UseTicketsRetorno {
  const [tickets, setTickets] = useState<TicketEntidad[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [pagina, setPagina] = useState<number>(1);
  const [limite, setLimite] = useState<number>(limitePorDefecto);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  const { estado, categoria, prioridad, asignado, buscar } = filtros || {};

  // Reiniciar a la página 1 cuando cualquiera de los filtros de búsqueda cambie
  useEffect(() => {
    setPagina(1);
  }, [estado, categoria, prioridad, asignado, buscar]);

  const cargarTickets = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await listarTicketsApi({
        estado,
        categoria,
        prioridad,
        asignado,
        buscar,
        pagina,
        limite,
      });

      setTickets(respuesta.tickets);
      setTotal(respuesta.total);
      setLimite(respuesta.limite);
      setTotalPaginas(respuesta.total_paginas || 1);
    } catch (err: any) {
      console.error('Error al cargar la lista de tickets:', err);
      const mensaje =
        err?.response?.data?.mensaje ||
        err?.message ||
        'No fue posible obtener los tickets. Por favor, intenta de nuevo.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [estado, categoria, prioridad, asignado, buscar, pagina, limite]);

  useEffect(() => {
    cargarTickets();
  }, [cargarTickets]);

  const cambiarPagina = useCallback((nuevaPagina: number) => {
    setPagina(nuevaPagina);
  }, []);

  return {
    tickets,
    cargando,
    error,
    total,
    pagina,
    limite,
    totalPaginas,
    cambiarPagina,
    recargar: cargarTickets,
  };
}
