/**
 * Cliente de Supabase para el Frontend
 * Inicializa la instancia del cliente SDK en el navegador utilizando la clave pública anónima (Anon Key).
 */

import { createClient } from '@supabase/supabase-js'

const urlSupabase = import.meta.env.VITE_SUPABASE_URL
const claveAnonSupabase = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!urlSupabase || !claveAnonSupabase) {
  console.warn(
    'Faltan variables de entorno para Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Verifica el archivo .env.'
  )
}

/**
 * Cliente de Supabase singleton para gestión de sesiones y autenticación en el cliente.
 */
export const clienteSupabase = createClient(
  urlSupabase || '',
  claveAnonSupabase || ''
)
