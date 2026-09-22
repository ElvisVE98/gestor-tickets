/**
 * Página de administración de usuarios y control de acceso.
 * Permite a los administradores visualizar la nómina del personal, invitar nuevos colaboradores,
 * actualizar roles operativos y gestionar la desactivación de cuentas.
 */

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUsuarios } from '@/hooks/useUsuarios';
import { UsuarioEntidad } from '@/types/usuario.type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModalInvitarUsuario } from '@/components/usuarios/ModalInvitarUsuario';
import { ModalCambiarRol } from '@/components/usuarios/ModalCambiarRol';
import { DialogConfirmarDesactivacion } from '@/components/usuarios/DialogConfirmarDesactivacion';
import {
  UserPlus,
  Users as UsersIcon,
  ShieldCheck,
  UserX,
  RotateCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente principal para el módulo de administración de usuarios.
 * Orquesta la tabla de colaboradores y el ciclo de vida de los modales de acción:
 * invitación vía Magic Link, modificación de roles y desactivación preventiva.
 */
export function Usuarios() {
  const { usuario: adminAutenticado } = useAuth();
  const { usuarios, cargando, error, recargar } = useUsuarios();

  // Estados locales para controlar la apertura y entidad en edición de los diálogos/modales
  const [modalInvitarAbierto, setModalInvitarAbierto] = useState<boolean>(false);
  const [usuarioParaCambiarRol, setUsuarioParaCambiarRol] =
    useState<UsuarioEntidad | null>(null);
  const [usuarioParaDesactivar, setUsuarioParaDesactivar] =
    useState<UsuarioEntidad | null>(null);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Administración de Usuarios
          </h1>
          <p className="text-sm text-slate-600">
            Gestiona el personal con acceso a la plataforma, asigna roles e invita colaboradores
          </p>
        </div>

        <Button
          onClick={() => setModalInvitarAbierto(true)}
          className="bg-[#312e81] text-white hover:bg-[#4338ca] shadow self-start sm:self-auto"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar usuario
        </Button>
      </div>

      {/* Estado de Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => recargar()}
            className="border-red-300 text-red-800 hover:bg-red-100"
          >
            <RotateCw className="mr-1.5 h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RotateCw className="h-8 w-8 animate-spin text-[#312e81]" />
            <p className="mt-3 text-sm font-medium">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-3">
              <UsersIcon className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              No hay usuarios registrados
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Usa el botón de invitar usuario para registrar el primer colaborador.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead className="w-[140px]">Rol</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[160px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => {
                const esUsuarioActual = adminAutenticado?.id === u.id;

                return (
                  <TableRow key={u.id} className="hover:bg-slate-50">
                    {/* Nombre y Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#312e81]/10 text-xs font-bold text-[#312e81]">
                          {u.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {u.nombre_completo}
                          </span>
                          {esUsuarioActual && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              (Tu cuenta)
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Correo Electrónico */}
                    <TableCell className="font-mono text-xs text-slate-700">
                      {u.correo_electronico}
                    </TableCell>

                    {/* Rol con Badge */}
                    <TableCell>
                      {u.rol === 'administrador' && (
                        <Badge variant="navy">Administrador</Badge>
                      )}
                      {u.rol === 'soporte' && (
                        <Badge variant="info">Soporte</Badge>
                      )}
                      {u.rol === 'solicitante' && (
                        <Badge variant="secondary">Solicitante</Badge>
                      )}
                    </TableCell>

                    {/* Estado con Badge */}
                    <TableCell>
                      {u.activo ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-slate-400 bg-slate-50 border-slate-200"
                        >
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Cambiar Rol */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!u.activo}
                          onClick={() => setUsuarioParaCambiarRol(u)}
                          className="h-8 text-xs border-slate-200 hover:bg-slate-100"
                          title="Cambiar rol"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-[#312e81]" />
                          Rol
                        </Button>

                        {/* Desactivar */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!u.activo || esUsuarioActual}
                          onClick={() => setUsuarioParaDesactivar(u)}
                          className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 disabled:opacity-40"
                          title={
                            esUsuarioActual
                              ? 'No puedes desactivar tu propia cuenta'
                              : !u.activo
                              ? 'El usuario ya está inactivo'
                              : 'Desactivar usuario'
                          }
                        >
                          <UserX className="h-3.5 w-3.5 mr-1" />
                          Desactivar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal: Invitar Nuevo Usuario */}
      <ModalInvitarUsuario
        abierto={modalInvitarAbierto}
        onOpenChange={setModalInvitarAbierto}
        onUsuarioInvitado={async (correo) => {
          await recargar();
          toast.success(`Invitación enviada exitosamente a ${correo}`);
        }}
      />

      {/* Modal: Cambiar Rol de Usuario */}
      <ModalCambiarRol
        usuario={usuarioParaCambiarRol}
        abierto={Boolean(usuarioParaCambiarRol)}
        onOpenChange={(open) => !open && setUsuarioParaCambiarRol(null)}
        onRolCambiado={async (nombreCompleto, nuevoRol) => {
          await recargar();
          toast.success(
            `Rol de ${nombreCompleto} actualizado a ${nuevoRol}`
          );
        }}
      />

      {/* Diálogo de Confirmación: Desactivar Usuario */}
      <DialogConfirmarDesactivacion
        usuario={usuarioParaDesactivar}
        abierto={Boolean(usuarioParaDesactivar)}
        onOpenChange={(open) => !open && setUsuarioParaDesactivar(null)}
        onDesactivado={async (nombreCompleto) => {
          await recargar();
          toast.success(
            `Usuario ${nombreCompleto} desactivado exitosamente`
          );
        }}
      />
    </div>
  );
}

export default Usuarios;
