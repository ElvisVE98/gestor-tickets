/**
 * Subcomponente de Tickets: PanelHistorialTicket
 * Renderiza la línea de tiempo vertical con el registro histórico de cambios de estado del ticket.
 */

import { HistorialTicketEntidad } from '@/types/ticket.type';
import { NOMBRES_ESTADOS, formatearFecha } from '@/lib/formateadores';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';

interface PanelHistorialTicketProps {
  historial: HistorialTicketEntidad[];
}

/**
 * Componente que muestra la cronología de eventos y auditoría de transiciones de estado.
 * 
 * @param historial Arreglo de registros históricos de cambios de estado.
 */
export function PanelHistorialTicket({ historial }: PanelHistorialTicketProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <History className="h-4 w-4 text-slate-500" />
          Actividad ({historial.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {historial.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 text-center">
            Sin cambios de estado registrados.
          </p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-2 space-y-4">
            {historial.map((item) => (
              <li key={item.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-[#1a2b5c]" />
                <p className="text-xs font-semibold text-slate-800">
                  {NOMBRES_ESTADOS[item.estado_anterior] || item.estado_anterior}{' '}
                  <span className="text-slate-400">→</span>{' '}
                  <span className="text-[#1a2b5c]">
                    {NOMBRES_ESTADOS[item.estado_nuevo] || item.estado_nuevo}
                  </span>
                </p>
                <time className="text-[10px] text-slate-400">
                  {formatearFecha(item.fecha_cambio)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default PanelHistorialTicket;
