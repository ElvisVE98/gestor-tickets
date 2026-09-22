/**
 * Subcomponente de Tickets: HiloComentarios
 * Renderiza el historial de conversación en orden cronológico y provee el formulario
 * para la publicación de nuevos comentarios en el ticket.
 */

import { useState } from 'react';
import { crearComentarioApi } from '@/api/tickets.api';
import { ComentarioEntidad } from '@/types/ticket.type';
import { formatearFecha } from '@/lib/formateadores';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface HiloComentariosProps {
  ticketId: string;
  comentarios: ComentarioEntidad[];
  onComentarioEnviado: () => Promise<void> | void;
}

/**
 * Muestra el hilo interactivo de comentarios de un ticket y gestiona el envío de respuestas.
 * 
 * @param ticketId Identificador UUID del ticket.
 * @param comentarios Lista de comentarios asociados.
 * @param onComentarioEnviado Callback disparado tras registrar un comentario con éxito.
 */
export function HiloComentarios({
  ticketId,
  comentarios,
  onComentarioEnviado,
}: HiloComentariosProps) {
  const [nuevoComentario, setNuevoComentario] = useState<string>('');
  const [enviandoComentario, setEnviandoComentario] = useState<boolean>(false);
  const [errorComentario, setErrorComentario] = useState<string | null>(null);

  // Procesa el envío del formulario de comentarios
  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !nuevoComentario.trim()) return;

    setEnviandoComentario(true);
    setErrorComentario(null);

    try {
      await crearComentarioApi(ticketId, nuevoComentario.trim());
      setNuevoComentario('');
      await onComentarioEnviado();
    } catch (err: any) {
      console.error('Error al enviar comentario:', err);
      setErrorComentario(
        err?.response?.data?.mensaje ||
          'Error al enviar el comentario. Inténtalo de nuevo.'
      );
    } finally {
      setEnviandoComentario(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          Comentarios ({comentarios.length})
        </h2>
      </div>

      {/* Lista de comentarios existentes */}
      <div className="space-y-3">
        {comentarios.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No hay comentarios en este ticket aún. ¡Sé el primero en comentar!
          </div>
        ) : (
          comentarios.map((comentario) => (
            <Card
              key={comentario.id}
              className="border-slate-200 bg-white shadow-sm"
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">Usuario</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      Mensaje
                    </Badge>
                  </div>
                  <span>{formatearFecha(comentario.fecha_creacion)}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {comentario.contenido}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Caja de Texto para nuevo comentario */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleEnviarComentario} className="space-y-3">
            {errorComentario && (
              <p className="text-xs font-medium text-red-600">
                {errorComentario}
              </p>
            )}
            <Textarea
              placeholder="Escribe un comentario o actualización sobre este ticket..."
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              disabled={enviandoComentario}
              className="min-h-[100px] resize-y"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={enviandoComentario || !nuevoComentario.trim()}
                className="bg-[#1a2b5c] text-white hover:bg-[#243b7d]"
              >
                {enviandoComentario ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar comentario
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default HiloComentarios;
