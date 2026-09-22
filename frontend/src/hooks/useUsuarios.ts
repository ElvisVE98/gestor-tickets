/**
 * Hook Personalizado: useUsuarios
 * Encapsula la obtención reactiva del catálogo completo de usuarios para el panel de administración.
 */

import { useState, useEffect, useCallback } from 'react';
import { listarUsuariosApi } from '@/api/usuarios.api';
import { UsuarioEntidad } from '@/types/usuario.type';

export interface UseUsuariosRetorno {
  usuarios: UsuarioEntidad[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Hook para consultar y recargar la lista de usuarios registrados en el sistema.
 * 
 * @returns Lista de usuarios, banderas de carga/error y función de recarga.
 */
export function useUsuarios(): UseUsuariosRetorno {
  const [usuarios, setUsuarios] = useState<UsuarioEntidad[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const datos = await listarUsuariosApi();
      setUsuarios(datos);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      const mensaje =
        err?.response?.data?.mensaje ||
        err?.message ||
        'No fue posible obtener la lista de usuarios.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  return {
    usuarios,
    cargando,
    error,
    recargar: cargarUsuarios,
  };
}
