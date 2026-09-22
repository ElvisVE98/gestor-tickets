/**
 * Utilidades de Estilos y Clases CSS
 * Provee la función auxiliar `cn` para concatenar y fusionar clases de Tailwind CSS sin conflictos.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina condicionalmente nombres de clases CSS y resuelve conflictos de especificidad de Tailwind.
 * 
 * @param inputs Lista de clases, objetos o expresiones condicionales de clase.
 * @returns Cadena resultante con las clases combinadas y optimizadas.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
