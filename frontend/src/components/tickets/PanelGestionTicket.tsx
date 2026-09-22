/**
 * Subcomponente de Tickets: PanelGestionTicket
 * Permite a usuarios de soporte y administradores cambiar el estado del ticket
 * y reasignar el técnico/agente responsable de su atención.
 */

import { useState, useEffect } from 'react';
import { cambiarEstadoTicketApi, asignarTicketApi } from '@/api/tickets.api';
import { listarAgentesSoporteApi } from '@/api/usuarios.api';
import { TicketEntidad, EstadoTicket } from '@/types/ticket.type';
import { AgenteSoporte } from '@/types/usuario.type';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PanelGestionTicketProps {
  ticket: TicketEntidad;
  onActualizado: () => Promise<void> | void;
}

/**
 * Panel de control técnico y administrativo para la gestión de tickets.
 * 
 * @param ticket Entidad del ticket a gestionar.
 * @param onActualizado Callback disparado tras actualizar el estado o la asignación.
 */
export function PanelGestionTicket({
  ticket,
  onActualizado,
}: PanelGestionTicketProps) {
  const [agentesSoporte, setAgentesSoporte] = useState<AgenteSoporte[]>([]);
  const [actualizandoGestion, setActualizandoGestion] = useState<boolean>(false);
  const [mensajeExitoGestion, setMensajeExitoGestion] = useState<string | null>(
    null
  );

  // Carga inicial del catálogo de agentes de soporte disponibles
  useEffect(() => {
    listarAgentesSoporteApi()
      .then((agentes) => setAgentesSoporte(agentes))
      .catch((err) => console.error('Error al cargar agentes de soporte:', err));
  }, []);

  // Procesa la actualización del estado del ticket
  const handleCambiarEstado = async (nuevoEstado: EstadoTicket) => {
    if (!ticket || ticket.estado === nuevoEstado) return;

    setActualizandoGestion(true);
    setMensajeExitoGestion(null);

    try {
      await cambiarEstadoTicketApi(ticket.id, nuevoEstado);
      await onActualizado();
      setMensajeExitoGestion('Estado actualizado con éxito');
      setTimeout(() => setMensajeExitoGestion(null), 3000);
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      toast.error(
        err?.response?.data?.mensaje || 'No se pudo actualizar el estado del ticket'
      );
    } finally {
      setActualizandoGestion(false);
    }
  };

  // Procesa la asignación o desasignación de agente
  const handleAsignarTicket = async (nuevoAsignadoId: string) => {
    if (!ticket) return;

    setActualizandoGestion(true);
    setMensajeExitoGestion(null);

    const valorAsignacion = nuevoAsignadoId === '' ? null : nuevoAsignadoId;

    try {
      await asignarTicketApi(ticket.id, valorAsignacion);
      await onActualizado();
      setMensajeExitoGestion('Asignación actualizada');
      setTimeout(() => setMensajeExitoGestion(null), 3000);
    } catch (err: any) {
      console.error('Error al asignar ticket:', err);
      toast.error(
        err?.response?.data?.mensaje || 'No se pudo actualizar la asignación'
      );
    } finally {
      setActualizandoGestion(false);
    }
  };

  return (
    <Card className="border-[#312e81]/20 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-[#312e81] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#312e81]" />
          Gestión del Ticket
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {mensajeExitoGestion && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-xs font-medium text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {mensajeExitoGestion}
          </div>
        )}

        {/* Selector de Estado */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Estado del ticket
          </label>
          <Select
            value={ticket.estado}
            disabled={actualizandoGestion}
            onChange={(e) => handleCambiarEstado(e.target.value as EstadoTicket)}
          >
            <option value="abierto">Abierto</option>
            <option value="en_progreso">En progreso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </Select>
        </div>

        {/* Selector de Asignación */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Asignado a
          </label>
          <Select
            value={ticket.asignado_a_id || ''}
            disabled={actualizandoGestion}
            onChange={(e) => handleAsignarTicket(e.target.value)}
          >
            <option value="">-- Sin asignar --</option>
            {agentesSoporte.map((agente) => (
              <option key={agente.id} value={agente.id}>
                {agente.nombre_completo} ({agente.rol})
              </option>
            ))}
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export default PanelGestionTicket;
