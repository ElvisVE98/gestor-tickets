/**
 * Subcomponente de Usuarios: ModalCambiarRol
 * Diálogo modal interactivo para modificar el rol de permisos de un usuario registrado.
 */

import { useState, useEffect } from 'react';
import { cambiarRolUsuarioApi } from '@/api/usuarios.api';
import { UsuarioEntidad, RolUsuario } from '@/types/usuario.type';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ModalCambiarRolProps {
  usuario: UsuarioEntidad | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onRolCambiado: (
    nombreCompleto: string,
    nuevoRol: RolUsuario
  ) => Promise<void> | void;
}

/**
 * Modal para seleccionar y actualizar el rol de un usuario ('solicitante', 'soporte', 'administrador').
 * 
 * @param usuario Entidad del usuario seleccionado para editar.
 * @param abierto Estado de visibilidad del modal.
 * @param onOpenChange Callback de apertura/cierre.
 * @param onRolCambiado Callback disparado tras actualizar el rol con éxito.
 */
export function ModalCambiarRol({
  usuario,
  abierto,
  onOpenChange,
  onRolCambiado,
}: ModalCambiarRolProps) {
  const [nuevoRolSeleccionado, setNuevoRolSeleccionado] =
    useState<RolUsuario>('solicitante');
  const [guardandoRol, setGuardandoRol] = useState<boolean>(false);

  // Sincroniza el rol seleccionado con el rol actual del usuario al abrir el modal
  useEffect(() => {
    if (usuario) {
      setNuevoRolSeleccionado(usuario.rol);
    }
  }, [usuario]);

  // Manejador para confirmar la actualización de rol en el backend
  const handleConfirmarCambioRol = async () => {
    if (!usuario) return;

    setGuardandoRol(true);
    try {
      await cambiarRolUsuarioApi(usuario.id, nuevoRolSeleccionado);
      onOpenChange(false);
      await onRolCambiado(usuario.nombre_completo, nuevoRolSeleccionado);
    } catch (err: any) {
      console.error('Error al cambiar rol:', err);
      toast.error(
        err?.response?.data?.mensaje || 'No se pudo actualizar el rol del usuario'
      );
    } finally {
      setGuardandoRol(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
          <DialogDescription>
            Selecciona el nivel de acceso para{' '}
            <strong className="text-slate-800">
              {usuario?.nombre_completo}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="selector-rol">Rol asignado</Label>
            <Select
              id="selector-rol"
              value={nuevoRolSeleccionado}
              disabled={guardandoRol}
              onChange={(e) =>
                setNuevoRolSeleccionado(e.target.value as RolUsuario)
              }
            >
              <option value="solicitante">
                Solicitante (Crea y visualiza sus propios tickets)
              </option>
              <option value="soporte">
                Soporte (Gestiona, responde y resuelve tickets)
              </option>
              <option value="administrador">
                Administrador (Control total del sistema y usuarios)
              </option>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={guardandoRol}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={guardandoRol}
            onClick={handleConfirmarCambioRol}
            className="bg-[#312e81] text-white hover:bg-[#4338ca]"
          >
            {guardandoRol ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Guardar cambio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ModalCambiarRol;
