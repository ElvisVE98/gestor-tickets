/**
 * Inicialización y configuración del cliente Supabase para el backend.
 * Provee una instancia con service_role key para acceso administrativo total a la base de datos y Storage.
 */

import { createClient } from '@supabase/supabase-js';
import { entorno } from './entorno';

// Workaround para el proxy/firewall corporativo de Curifor, que intercepta 
// HTTPS con certificado autofirmado y rompe la validación TLS de Node.
// SOLO se activa en desarrollo — jamás debe ejecutarse en producción.
if (entorno.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * Cliente administrativo de Supabase con permisos totales (bypassea RLS).
 * Configurado sin persistencia de sesión ni refresco automático para operar en entorno de servidor stateless.
 */
export const clienteSupabase = createClient(
  entorno.SUPABASE_URL,
  entorno.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
