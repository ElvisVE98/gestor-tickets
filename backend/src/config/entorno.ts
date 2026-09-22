/**
 * Capa de configuración y validación de variables de entorno.
 * Valida de forma estricta las variables requeridas usando Zod al iniciar el proceso,
 * deteniendo la ejecución de inmediato si falta alguna configuración crítica.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

// Esquema de validación y coerción para las variables de entorno requeridas
const esquemaEntorno = z.object({
  PUERTO: z
    .string()
    .default('3000')
    .transform((valor) => parseInt(valor, 10))
    .refine((numero) => !isNaN(numero) && numero > 0, {
      message: 'El PUERTO debe ser un número entero positivo',
    }),

  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      errorMap: () => ({
        message: 'NODE_ENV debe ser "development", "production" o "test"',
      }),
    })
    .default('development'),

  FRONTEND_URL: z
    .string({
      required_error: 'La variable FRONTEND_URL es obligatoria para la configuración de CORS',
    })
    .min(1, {
      message: 'FRONTEND_URL no puede estar vacía',
    }),

  SUPABASE_URL: z
    .string({
      required_error: 'La variable SUPABASE_URL es obligatoria',
    })
    .url({
      message: 'SUPABASE_URL debe ser una URL válida',
    }),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string({
      required_error: 'La variable SUPABASE_SERVICE_ROLE_KEY es obligatoria',
    })
    .min(1, {
      message: 'SUPABASE_SERVICE_ROLE_KEY no puede estar vacía',
    }),
});

// Validación en tiempo de arranque de las variables de entorno del proceso
const resultadoValidacion = esquemaEntorno.safeParse(process.env);

if (!resultadoValidacion.success) {
  console.error('❌ Error crítico: Configuración inválida en las variables de entorno');
  console.error(resultadoValidacion.error.format());
  process.exit(1);
}

// Exportamos las variables validadas y tipadas para su consumo seguro en toda la aplicación
export const entorno = resultadoValidacion.data;
