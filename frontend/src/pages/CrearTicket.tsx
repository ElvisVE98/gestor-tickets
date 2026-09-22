/**
 * Página para la creación de nuevos tickets de soporte técnico.
 * Presenta un formulario validado con Zod y react-hook-form para registrar solicitudes en la mesa de ayuda,
 * permitiendo además adjuntar archivos locales (imágenes y PDFs) que se suben secuencialmente tras crear el ticket.
 */

import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { crearTicketApi, subirAdjuntoApi } from '@/api/tickets.api';
import { esquemaCrearTicket, CrearTicketEntrada } from '@/schemas/ticket.schema';
import { PrioridadTicket } from '@/types/ticket.type';
import { NOMBRES_CATEGORIAS, formatearFolio } from '@/lib/formateadores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  PlusCircle,
  Paperclip,
  FileText,
  FileImage,
  File as FileIcon,
  X,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

/** Tamaño máximo permitido por archivo: 5 MB */
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/** Extensiones y tipos MIME autorizados */
const EXTENSIONES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

/**
 * Configuración visual de los niveles de prioridad disponibles para selección por botones/chips.
 */
const PRIORIDADES: { id: PrioridadTicket; label: string; clasesActivo: string }[] = [
  {
    id: 'baja',
    label: 'Baja',
    clasesActivo: 'bg-slate-700 text-white border-slate-700 shadow-sm',
  },
  {
    id: 'media',
    label: 'Media',
    clasesActivo: 'bg-sky-600 text-white border-sky-600 shadow-sm',
  },
  {
    id: 'alta',
    label: 'Alta',
    clasesActivo: 'bg-amber-600 text-white border-amber-600 shadow-sm',
  },
  {
    id: 'urgente',
    label: 'Urgente',
    clasesActivo: 'bg-red-600 text-white border-red-600 shadow-sm',
  },
];

/**
 * Componente de vista para registrar un nuevo ticket.
 * Permite ingresar título, categoría, prioridad, descripción detallada y seleccionar
 * archivos adjuntos locales que se envían automáticamente al backend tras generar el ticket.
 */
export function CrearTicket() {
  const navigate = useNavigate();
  const inputArchivosRef = useRef<HTMLInputElement>(null);

  // Estados de carga y flujo
  const [enviando, setEnviando] = useState<boolean>(false);
  const [faseEnvio, setFaseEnvio] = useState<'inactivo' | 'creando_ticket' | 'subiendo_adjuntos'>('inactivo');
  const [progresoAdjuntos, setProgresoAdjuntos] = useState<{ actual: number; total: number }>({
    actual: 0,
    total: 0,
  });
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Estado local para los archivos seleccionados antes de la creación
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
  const [errorAdjuntos, setErrorAdjuntos] = useState<string | null>(null);

  // Inicialización de react-hook-form con valores por defecto y esquema Zod
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CrearTicketEntrada>({
    resolver: zodResolver(esquemaCrearTicket),
    defaultValues: {
      titulo: '',
      categoria: 'soporte_ti',
      prioridad: 'media',
      descripcion: '',
    },
  });

  const prioridadSeleccionada = watch('prioridad');

  /**
   * Formatea el tamaño del archivo en bytes a una representación legible en KB o MB.
   */
  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Determina el icono correspondiente según la extensión del archivo.
   */
  const renderIconoArchivo = (nombre: string) => {
    const extension = nombre.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return <FileImage className="h-4 w-4 text-sky-600 shrink-0" />;
    }
    if (extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-600 shrink-0" />;
    }
    return <FileIcon className="h-4 w-4 text-slate-500 shrink-0" />;
  };

  /**
   * Valida y agrega nuevos archivos al estado local de adjuntos.
   * Rechaza archivos que superen 5 MB o no tengan formato compatible.
   */
  const handleSeleccionarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lista = e.target.files;
    if (!lista || lista.length === 0) return;

    setErrorAdjuntos(null);
    const nuevosValidos: File[] = [];
    const erroresValidacion: string[] = [];

    Array.from(lista).forEach((archivo) => {
      const extension = archivo.name.split('.').pop()?.toLowerCase() || '';

      // 1. Validar extensión compatible
      if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
        erroresValidacion.push(`"${archivo.name}" no es un formato permitido (JPG, PNG, WEBP, PDF).`);
        return;
      }

      // 2. Validar límite de peso (5 MB)
      if (archivo.size > TAMANO_MAXIMO_BYTES) {
        erroresValidacion.push(`"${archivo.name}" supera el límite máximo de 5 MB.`);
        return;
      }

      // 3. Evitar duplicados exactos en la lista local
      const yaExiste = archivosSeleccionados.some(
        (a) => a.name === archivo.name && a.size === archivo.size
      );
      if (!yaExiste) {
        nuevosValidos.push(archivo);
      }
    });

    if (erroresValidacion.length > 0) {
      setErrorAdjuntos(erroresValidacion.join(' '));
    }

    if (nuevosValidos.length > 0) {
      setArchivosSeleccionados((prev) => [...prev, ...nuevosValidos]);
    }

    // Resetear el input para permitir volver a seleccionar el mismo archivo si fue removido
    if (inputArchivosRef.current) {
      inputArchivosRef.current.value = '';
    }
  };

  /**
   * Remueve un archivo de la lista de adjuntos pendientes antes del envío.
   */
  const handleRemoverArchivo = (indiceParaRemover: number) => {
    setArchivosSeleccionados((prev) =>
      prev.filter((_, indice) => indice !== indiceParaRemover)
    );
  };

  /**
   * Envía los datos validados del ticket a la API backend y sube secuencialmente los archivos seleccionados.
   * 
   * Flujo y decisiones de diseño:
   * 1. Inserta el ticket principal en la base de datos vía `crearTicketApi`.
   * 2. Si hay archivos seleccionados, los sube de manera secuencial (uno a uno) con `subirAdjuntoApi`
   *    para no saturar el backend con múltiples peticiones multipart concurrentes.
   * 3. Si un archivo falla al subir tras haberse creado el ticket, no se aborta la operación:
   *    se notifica una advertencia y se redirige al usuario al detalle para que pueda reintentar.
   */
  const onSubmit = async (valores: CrearTicketEntrada) => {
    setErrorServidor(null);
    setEnviando(true);
    setFaseEnvio('creando_ticket');

    try {
      // 1. Crear el ticket en la base de datos
      const nuevoTicket = await crearTicketApi(valores);

      // 2. Si no hay archivos adjuntos, navegar directamente al ticket
      if (archivosSeleccionados.length === 0) {
        toast.success(`Ticket ${formatearFolio(nuevoTicket.folio)} creado exitosamente.`);
        navigate(`/tickets/${nuevoTicket.id}`, { replace: true });
        return;
      }

      // 3. Subir los archivos adjuntos de forma secuencial
      setFaseEnvio('subiendo_adjuntos');
      const adjuntosFallidos: string[] = [];

      for (let i = 0; i < archivosSeleccionados.length; i++) {
        const archivo = archivosSeleccionados[i];
        setProgresoAdjuntos({ actual: i + 1, total: archivosSeleccionados.length });

        try {
          await subirAdjuntoApi(nuevoTicket.id, archivo);
        } catch (errAdjunto) {
          console.error(`Error al subir el adjunto "${archivo.name}":`, errAdjunto);
          adjuntosFallidos.push(archivo.name);
        }
      }

      // 4. Feedback al usuario según el resultado de las subidas
      if (adjuntosFallidos.length > 0) {
        toast.warning(
          `Ticket ${formatearFolio(nuevoTicket.folio)} creado, pero los siguientes archivos no se pudieron subir: ${adjuntosFallidos.join(
            ', '
          )}. Puedes reintentar la subida desde el detalle del ticket.`
        );
      } else {
        toast.success(
          `Ticket ${formatearFolio(nuevoTicket.folio)} y sus ${archivosSeleccionados.length} adjunto(s) creados con éxito.`
        );
      }

      // 5. Redirigir al detalle del ticket recién generado
      navigate(`/tickets/${nuevoTicket.id}`, { replace: true });
    } catch (err: any) {
      console.error('Error al crear el ticket:', err);
      const mensaje =
        err?.response?.data?.mensaje ||
        err?.message ||
        'Ocurrió un error al crear el ticket. Inténtalo nuevamente.';
      setErrorServidor(mensaje);
    } finally {
      setEnviando(false);
      setFaseEnvio('inactivo');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Botón de retroceso */}
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#312e81] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a tickets
        </Link>
      </div>

      {/* Tarjeta del formulario */}
      <Card className="border-slate-200 bg-white shadow-md">
        <CardHeader className="space-y-1 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-[#312e81]">
            <PlusCircle className="h-5 w-5" />
            <CardTitle className="text-xl font-bold">Crear Nuevo Ticket</CardTitle>
          </div>
          <CardDescription>
            Completa la información detallada para registrar una nueva solicitud en la mesa de ayuda
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {errorServidor && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorServidor}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Campo Título */}
            <div className="space-y-1.5">
              <Label htmlFor="titulo">
                Título o Asunto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                placeholder="Ej: Error al emitir factura en Flexline o problemas con correo"
                disabled={enviando}
                {...register('titulo')}
                className={errors.titulo ? 'border-red-500' : ''}
              />
              {errors.titulo && (
                <p className="text-xs text-red-600">{errors.titulo.message}</p>
              )}
            </div>

            {/* Fila: Categoría y Prioridad */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Campo Categoría */}
              <div className="space-y-1.5">
                <Label htmlFor="categoria">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="categoria"
                  disabled={enviando}
                  {...register('categoria')}
                  className={errors.categoria ? 'border-red-500' : ''}
                >
                  <option value="soporte_ti">{NOMBRES_CATEGORIAS.soporte_ti}</option>
                  <option value="erp_flexline">{NOMBRES_CATEGORIAS.erp_flexline}</option>
                  <option value="rindegasto">{NOMBRES_CATEGORIAS.rindegasto}</option>
                  <option value="solicitud_desarrollo">
                    {NOMBRES_CATEGORIAS.solicitud_desarrollo}
                  </option>
                  <option value="otro">{NOMBRES_CATEGORIAS.otro}</option>
                </Select>
                {errors.categoria && (
                  <p className="text-xs text-red-600">{errors.categoria.message}</p>
                )}
              </div>

              {/* Campo Prioridad (Chips/Botones) */}
              <div className="space-y-1.5">
                <Label>
                  Prioridad <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {PRIORIDADES.map((p) => {
                    const esSeleccionado = prioridadSeleccionada === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={enviando}
                        onClick={() =>
                          setValue('prioridad', p.id, { shouldValidate: true })
                        }
                        className={`py-2 px-1 text-xs font-semibold rounded-md border text-center transition-all ${
                          esSeleccionado
                            ? p.clasesActivo
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                {errors.prioridad && (
                  <p className="text-xs text-red-600">{errors.prioridad.message}</p>
                )}
              </div>
            </div>

            {/* Campo Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="descripcion">
                Descripción detallada <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="descripcion"
                rows={6}
                placeholder="Describe con precisión qué ocurre, mensajes de error, pasos para reproducir o detalles del requerimiento..."
                disabled={enviando}
                {...register('descripcion')}
                className={errors.descripcion ? 'border-red-500 min-h-[140px]' : 'min-h-[140px]'}
              />
              {errors.descripcion && (
                <p className="text-xs text-red-600">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Sección: Adjuntar Archivos Opcionales */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-slate-800">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  Archivos adjuntos (opcional)
                </Label>
                <span className="text-xs text-slate-400">
                  JPG, PNG, WEBP o PDF · Máx. 5 MB c/u
                </span>
              </div>

              {/* Input oculto y botón para seleccionar */}
              <input
                type="file"
                ref={inputArchivosRef}
                onChange={handleSeleccionarArchivos}
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                multiple
                disabled={enviando}
                className="hidden"
              />

              <div
                onClick={() => !enviando && inputArchivosRef.current?.click()}
                className={`border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  enviando
                    ? 'opacity-60 cursor-not-allowed bg-slate-50'
                    : 'hover:border-[#312e81]/50 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                  <UploadCloud className="h-6 w-6 text-slate-400" />
                  <p className="text-xs font-medium text-slate-700">
                    Haz clic aquí para seleccionar archivos o capturas de pantalla
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Puedes adjuntar múltiples archivos antes de crear el ticket
                  </p>
                </div>
              </div>

              {/* Mensaje de error al validar archivos locales */}
              {errorAdjuntos && (
                <p className="text-xs font-medium text-red-600">{errorAdjuntos}</p>
              )}

              {/* Lista de archivos seleccionados */}
              {archivosSeleccionados.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-medium text-slate-600">
                    Archivos listos para subir ({archivosSeleccionados.length}):
                  </p>
                  <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-slate-50/60 overflow-hidden">
                    {archivosSeleccionados.map((archivo, index) => (
                      <li
                        key={`${archivo.name}-${archivo.size}-${index}`}
                        className="flex items-center justify-between py-2 px-3 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate mr-2">
                          {renderIconoArchivo(archivo.name)}
                          <span className="font-medium text-slate-800 truncate">
                            {archivo.name}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                            ({formatearTamano(archivo.size)})
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={enviando}
                          onClick={() => handleRemoverArchivo(index)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors disabled:opacity-40"
                          title="Quitar archivo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                disabled={enviando}
                onClick={() => navigate('/tickets')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={enviando}
                className="bg-[#312e81] text-white hover:bg-[#4338ca] shadow min-w-[140px]"
              >
                {enviando ? (
                  faseEnvio === 'subiendo_adjuntos' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo adjuntos ({progresoAdjuntos.actual}/{progresoAdjuntos.total})...
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando ticket...
                    </>
                  )
                ) : (
                  'Crear ticket'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CrearTicket;

