/**
 * Componente UI: BadgeEstado
 * Insignia visual reutilizable para representar el estado actual de un ticket con sus colores y variantes corporativas.
 */

import { Badge } from '@/components/ui/badge';
import { EstadoTicket } from '@/types/ticket.type';
import { NOMBRES_ESTADOS } from '@/lib/formateadores';

const VARIANTES_ESTADO: Record<
  EstadoTicket,
  'info' | 'navy' | 'success' | 'secondary'
> = {
  abierto: 'info',
  en_progreso: 'navy',
  resuelto: 'success',
  cerrado: 'secondary',
};

interface BadgeEstadoProps {
  estado: EstadoTicket;
  className?: string;
}

/**
 * Renderiza el Badge correspondiente al estado con su variante de color y etiqueta en español.
 * 
 * @param estado Estado del ticket ('abierto', 'en_progreso', 'resuelto', 'cerrado').
 * @param className Clases CSS opcionales adicionales.
 */
export function BadgeEstado({ estado, className }: BadgeEstadoProps) {
  const variant = VARIANTES_ESTADO[estado] || 'secondary';
  const label = NOMBRES_ESTADOS[estado] || estado;

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

export default BadgeEstado;
