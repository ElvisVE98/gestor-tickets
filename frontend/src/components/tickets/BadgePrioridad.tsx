/**
 * Componente UI: BadgePrioridad
 * Insignia visual reutilizable para representar el nivel de prioridad de un ticket con sus colores semánticos.
 */

import { Badge } from '@/components/ui/badge';
import { PrioridadTicket } from '@/types/ticket.type';
import { NOMBRES_PRIORIDADES } from '@/lib/formateadores';

const VARIANTES_PRIORIDAD: Record<
  PrioridadTicket,
  'destructive' | 'warning' | 'info' | 'secondary'
> = {
  urgente: 'destructive',
  alta: 'warning',
  media: 'info',
  baja: 'secondary',
};

interface BadgePrioridadProps {
  prioridad: PrioridadTicket;
  className?: string;
}

/**
 * Renderiza el Badge correspondiente a la prioridad con su variante de color y etiqueta en español.
 * 
 * @param prioridad Nivel de prioridad del ticket ('baja', 'media', 'alta', 'urgente').
 * @param className Clases CSS opcionales adicionales.
 */
export function BadgePrioridad({ prioridad, className }: BadgePrioridadProps) {
  const variant = VARIANTES_PRIORIDAD[prioridad] || 'secondary';
  const label = NOMBRES_PRIORIDADES[prioridad] || prioridad;

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

export default BadgePrioridad;
