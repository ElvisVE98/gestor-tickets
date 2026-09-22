/**
 * Subcomponente de Usuarios: DialogConfirmarDesactivacion
 * Diálogo modal de alerta (AlertDialog) para confirmar la desactivación segura (baja lógica) de una cuenta de usuario.
 */

import { useState } from 'react';
import { desactivarUsuarioApi } from '@/api/usuarios.api';
import { UsuarioEntidad } from '@/types/usuario.type';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DialogConfirmarDesactivacionProps {
  usuario: UsuarioEntidad | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onDesactivado: (nombreCompleto: string) => Promise<void> | void;
}

/**
 * Cuadro de diálogo de confirmación para deshabilitar el acceso de un usuario.
 * 
 * @param usuario Entidad del usuario a desactivar.
 * @param abierto Estado de visibilidad del diálogo.
 * @param onOpenChange Callback de apertura/cierre.
 * @param onDesactivado Callback disparado tras completar la desactivación en el backend.
 */
export function DialogConfirmarDesactivacion({
  usuario,
  abierto,
  onOpenChange,
  onDesactivado,
}: DialogConfirmarDesactivacionProps) {
  const [desactivando, setDesactivando] = useState<boolean>(false);

  // Procesa la llamada a la API para desactivar al usuario
  const handleConfirmarDesactivar = async () => {
    if (!usuario) return;

    setDesactivando(true);
    try {
      await desactivarUsuarioApi(usuario.id);
      onOpenChange(false);
      await onDesactivado(usuario.nombre_completo);
    } catch (err: any) {
      console.error('Error al desactivar usuario:', err);
      toast.error(err?.response?.data?.mensaje || 'No se pudo desactivar el usuario');
    } finally {
      setDesactivando(false);
    }
  };

  return (
    <AlertDialog open={abierto} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmas la desactivación?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de desactivar la cuenta de{' '}
            <strong className="text-slate-900">
              {usuario?.nombre_completo}
            </strong>{' '}
            ({usuario?.correo_electronico}). El usuario perderá acceso de
            inmediato a la plataforma.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={desactivando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={desactivando}
            onClick={handleConfirmarDesactivar}
          >
            {desactivando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desactivando...
              </>
            ) : (
              'Desactivar cuenta'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DialogConfirmarDesactivacion;
