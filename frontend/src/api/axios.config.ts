/**
 * Configuración del Cliente HTTP (Axios)
 * Inicializa la instancia global de Axios y configura el interceptor de peticiones
 * para inyectar dinámicamente el token Bearer de Supabase Auth en cada llamada.
 */

import axios from 'axios'
import { clienteSupabase } from '@/lib/supabase'

const urlApi = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Instancia global de Axios configurada con la URL base del backend REST.
 */
export const clienteAxios = axios.create({
  baseURL: urlApi,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Interceptor de solicitudes para inyectar automáticamente el token Bearer.
 * 
 * Decisión técnica: Se consulta `clienteSupabase.auth.getSession()` en cada petición
 * en lugar de guardar un token estático en memoria o localStorage. Esto garantiza
 * que si Supabase refresca el token silenciosamente en segundo plano, las peticiones
 * subsiguientes utilicen siempre el token válido más reciente sin provocar errores 401.
 */
clienteAxios.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await clienteSupabase.auth.getSession()

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.error('Error al obtener sesión de Supabase para Authorization header:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
