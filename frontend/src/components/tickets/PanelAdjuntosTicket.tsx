/**
 * Subcomponente de Tickets: PanelAdjuntosTicket
 * Gestiona la lista de archivos adjuntos, el input para subida de nuevos documentos/imágenes
 * y la generación interactiva de URLs seguras para su descarga o previsualización.
 */

import { useState, useRef } from 'react';
import { subirAdjuntoApi, obtenerUrlDescargaAdjuntoApi } from '@/api/tickets.api';
import { AdjuntoEntidad } from '@/types/ticket.type';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Paperclip,
  FileText,
  FileImage,
  File,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PanelAdjuntosTicketProps {
  ticketId: string;
  adjuntos: AdjuntoEntidad[];
  onAdjuntoSubido: () => Promise<void> | void;
}

/**
 * Muestra los archivos adjuntos vinculados al ticket y permite subir nuevos archivos (máx 5 MB).
 * 
 * @param ticketId Identificador UUID del ticket.
 * @param adjuntos Lista de adjuntos asociados.
 * @param onAdjuntoSubido Callback disparado tras completar la subida de un nuevo archivo.
 */
export function PanelAdjuntosTicket({
  ticketId,
  adjuntos,
  onAdjuntoSubido,
}: PanelAdjuntosTicketProps) {
  const [subiendoArchivo, setSubiendoArchivo] = useState<boolean>(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  // Formatea el tamaño en bytes a KB o MB legibles
  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Determina el ícono representativo según el tipo MIME y la extensión
  const renderIconoArchivo = (tipo: string, nombre: string) => {
    const extension = nombre.split('.').pop()?.toLowerCase() || '';
    if (
      tipo.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
    ) {
      return <FileImage className="h-5 w-5 text-sky-600" />;
    }
    if (tipo === 'application/pdf' || extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-slate-500" />;
  };

  // Manejador del evento de selección de archivo en el input
  const handleSubirArchivo = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivos = e.target.files;
    if (!ticketId || !archivos || archivos.length === 0) return;

    const archivo = archivos[0];
    setSubiendoArchivo(true);
    setErrorArchivo(null);

    try {
      await subirAdjuntoApi(ticketId, archivo);
      await onAdjuntoSubido();
      if (inputArchivoRef.current) {
        inputArchivoRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error al subir adjunto:', err);
      setErrorArchivo(
        err?.response?.data?.mensaje ||
          'Error al subir el archivo. Máximo permitido: 5 MB (PDF o Imagen).'
      );
    } finally {
      setSubiendoArchivo(false);
    }
  };

  // Solicita la URL prefirmada al backend y abre la descarga en una nueva pestaña
  const handleDescargarAdjunto = async (idAdjunto: string) => {
    if (!ticketId) return;

    try {
      const { url } = await obtenerUrlDescargaAdjuntoApi(ticketId, idAdjunto);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error al obtener enlace de descarga:', err);
      toast.error('No se pudo generar la URL de descarga del archivo.');
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Paperclip className="h-4 w-4 text-slate-500" />
          Adjuntos ({adjuntos.length})
        </CardTitle>

        <div>
          <input
            type="file"
            ref={inputArchivoRef}
            onChange={handleSubirArchivo}
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={subiendoArchivo}
            onClick={() => inputArchivoRef.current?.click()}
            className="h-7 text-xs border-slate-300 text-[#312e81] hover:bg-slate-100"
          >
            {subiendoArchivo ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Subiendo...
              </>
            ) : (
              '+ Adjuntar'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {errorArchivo && (
          <p className="text-xs font-medium text-red-600 mb-2">
            {errorArchivo}
          </p>
        )}

        {adjuntos.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 text-center">
            No hay archivos adjuntos en este ticket.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {adjuntos.map((adjunto) => (
              <li
                key={adjunto.id}
                onClick={() => handleDescargarAdjunto(adjunto.id)}
                className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded cursor-pointer transition-colors group"
                title="Haz clic para abrir o descargar el archivo"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  {renderIconoArchivo(
                    adjunto.tipo_archivo,
                    adjunto.nombre_archivo
                  )}
                  <span className="text-xs font-medium text-slate-700 truncate group-hover:text-[#312e81] group-hover:underline">
                    {adjunto.nombre_archivo}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatearTamano(adjunto.tamano_bytes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default PanelAdjuntosTicket;
