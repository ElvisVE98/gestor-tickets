/**
 * Subcomponente de Usuarios: ModalInvitarUsuario
 * Diálogo modal para registrar y despachar invitaciones por correo electrónico
 * a nuevos colaboradores utilizando react-hook-form y validación con Zod.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invitarUsuarioApi } from '@/api/usuarios.api';
import {
  esquemaInvitarUsuario,
  InvitarUsuarioEntrada,
} from '@/schemas/usuario.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ModalInvitarUsuarioProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onUsuarioInvitado: (correo: string) => Promise<void> | void;
}

/**
 * Modal interactivo que encapsula el formulario de invitación de nuevos usuarios.
 * 
 * @param abierto Estado de visibilidad del modal.
 * @param onOpenChange Callback de apertura/cierre.
 * @param onUsuarioInvitado Callback disparado tras registrar la invitación con éxito en el backend.
 */
export function ModalInvitarUsuario({
  abierto,
  onOpenChange,
  onUsuarioInvitado,
}: ModalInvitarUsuarioProps) {
  const [enviandoInvitacion, setEnviandoInvitacion] = useState<boolean>(false);
  const [errorInvitacion, setErrorInvitacion] = useState<string | null>(null);

  // Inicialización de react-hook-form con resolución de esquema Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvitarUsuarioEntrada>({
    resolver: zodResolver(esquemaInvitarUsuario),
    defaultValues: {
      nombre_completo: '',
      correo_electronico: '',
    },
  });

  // Limpia el formulario y los errores al abrir el modal
  useEffect(() => {
    if (abierto) {
      setErrorInvitacion(null);
      reset({
        nombre_completo: '',
        correo_electronico: '',
      });
    }
  }, [abierto, reset]);

  // Manejador del submit del formulario
  const onSubmitInvitar = async (valores: InvitarUsuarioEntrada) => {
    setErrorInvitacion(null);
    setEnviandoInvitacion(true);

    try {
      await invitarUsuarioApi(valores);
      onOpenChange(false);
      reset();
      await onUsuarioInvitado(valores.correo_electronico);
    } catch (err: any) {
      console.error('Error al invitar usuario:', err);
      setErrorInvitacion(
        err?.response?.data?.mensaje ||
          err?.message ||
          'No fue posible enviar la invitación. Inténtalo de nuevo.'
      );
    } finally {
      setEnviandoInvitacion(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Envía una invitación por correo electrónico para que el colaborador
            active su acceso.
          </DialogDescription>
        </DialogHeader>

        {errorInvitacion && (
          <div className="my-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorInvitacion}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitInvitar)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nombre_completo">
              Nombre Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_completo"
              placeholder="Ej: Carolina Morales"
              disabled={enviandoInvitacion}
              {...register('nombre_completo')}
              className={errors.nombre_completo ? 'border-red-500' : ''}
            />
            {errors.nombre_completo && (
              <p className="text-xs text-red-600">
                {errors.nombre_completo.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="correo_electronico">
              Correo Electrónico Corporativo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="correo_electronico"
              type="email"
              placeholder="cmorales@curifor.com"
              disabled={enviandoInvitacion}
              {...register('correo_electronico')}
              className={errors.correo_electronico ? 'border-red-500' : ''}
            />
            {errors.correo_electronico && (
              <p className="text-xs text-red-600">
                {errors.correo_electronico.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={enviandoInvitacion}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={enviandoInvitacion}
              className="bg-[#1a2b5c] text-white hover:bg-[#243b7d]"
            >
              {enviandoInvitacion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar invitación'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ModalInvitarUsuario;
