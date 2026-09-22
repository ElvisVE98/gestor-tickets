/**
 * Página de inicio de sesión de la plataforma de tickets.
 * Maneja la autenticación de usuarios mediante Supabase Auth, validación de formulario con Zod
 * y solicitud de enlaces de recuperación de contraseña.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { clienteSupabase } from '@/lib/supabase';
import { esquemaLogin, LoginEntrada } from '@/schemas/login.schema';
import {
  esquemaRecuperarPassword,
  RecuperarPasswordEntrada,
} from '@/schemas/password.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente de vista para el inicio de sesión.
 * Permite a los colaboradores autenticarse con correo corporativo y contraseña,
 * o solicitar un enlace de restablecimiento si olvidaron sus credenciales.
 */
export function Login() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  // Estados para el modal de recuperación de contraseña
  const [modalRecuperarAbierto, setModalRecuperarAbierto] = useState<boolean>(false);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState<boolean>(false);
  const [recuperacionExitosa, setRecuperacionExitosa] = useState<boolean>(false);

  // Configuración de react-hook-form para login
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginEntrada>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: {
      correo_electronico: '',
      contrasena: '',
    },
  });

  // Configuración de react-hook-form para recuperación de contraseña
  const {
    register: registerRecuperar,
    handleSubmit: handleSubmitRecuperar,
    reset: resetRecuperar,
    formState: { errors: errorsRecuperar },
  } = useForm<RecuperarPasswordEntrada>({
    resolver: zodResolver(esquemaRecuperarPassword),
    defaultValues: {
      correo_electronico: '',
    },
  });

  /**
   * Procesa el envío del formulario de login.
   * Ejecuta el inicio de sesión en Supabase y redirige a la vista principal si tiene éxito.
   */
  const onSubmit = async (valores: LoginEntrada) => {
    setErrorServidor(null);
    setEnviando(true);

    try {
      // 1. Intentar iniciar sesión mediante el contexto global
      await iniciarSesion(valores.correo_electronico, valores.contrasena);
      // 2. Redirigir a la bandeja principal de tickets reemplazando el historial de navegación
      navigate('/tickets', { replace: true });
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      const mensaje = error?.message?.toLowerCase() || '';

      // 3. Mapear códigos o textos de error de Supabase/Backend a mensajes comprensibles
      if (
        mensaje.includes('invalid login credentials') ||
        mensaje.includes('invalid_grant') ||
        mensaje.includes('credenciales')
      ) {
        setErrorServidor('Correo electrónico o contraseña incorrectos.');
      } else if (
        mensaje.includes('no se encuentra activa') ||
        mensaje.includes('desactivada') ||
        mensaje.includes('acceso')
      ) {
        setErrorServidor('Tu cuenta está desactivada o no tiene acceso a la plataforma.');
      } else if (mensaje.includes('failed to fetch') || mensaje.includes('network')) {
        setErrorServidor('No fue posible conectar con el servidor. Revisa tu conexión.');
      } else {
        setErrorServidor(
          error?.message || 'Ocurrió un error al iniciar sesión. Por favor intenta de nuevo.'
        );
      }
    } finally {
      setEnviando(false);
    }
  };

  /**
   * Procesa la solicitud de recuperación de contraseña.
   * Envía el enlace de restablecimiento con redirección a /establecer-password.
   * Aplica respuesta genérica para evitar enumeración de usuarios.
   */
  const onSubmitRecuperar = async (valores: RecuperarPasswordEntrada) => {
    setEnviandoRecuperacion(true);

    try {
      const urlRedireccion = `${window.location.origin}/establecer-password`;

      // 1. Solicitar enlace de recuperación a Supabase Auth
      await clienteSupabase.auth.resetPasswordForEmail(
        valores.correo_electronico.trim().toLowerCase(),
        {
          redirectTo: urlRedireccion,
        }
      );

      // 2. Mostrar estado de éxito genérico
      setRecuperacionExitosa(true);
      toast.success('Solicitud procesada correctamente.');
    } catch (err) {
      console.error('Error al solicitar recuperación de contraseña:', err);
      // Por seguridad, confirmamos el envío para no revelar la existencia del correo
      setRecuperacionExitosa(true);
    } finally {
      setEnviandoRecuperacion(false);
    }
  };

  const cerrarModalRecuperar = () => {
    setModalRecuperarAbierto(false);
    setTimeout(() => {
      setRecuperacionExitosa(false);
      resetRecuperar();
    }, 300);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Fondo visual atractivo con gradientes dinámicos y patrón ambiental */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Encabezado con identidad visual Resolva */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#312e81] text-white shadow-lg ring-1 ring-white/20">
            <span className="text-xl font-bold tracking-wider">R</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Plataforma de Tickets
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Sistema de Soporte Interno
          </p>
        </div>

        {/* Tarjeta con formulario */}
        <Card className="border-slate-800 bg-white/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-[#312e81]">
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales corporativas para acceder
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Mensaje de error amigable */}
            {errorServidor && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorServidor}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Campo Correo Electrónico */}
              <div className="space-y-1.5">
                <Label htmlFor="correo_electronico">Correo Electrónico</Label>
                <Input
                  id="correo_electronico"
                  type="email"
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  disabled={enviando}
                  {...register('correo_electronico')}
                  className={errors.correo_electronico ? 'border-red-500' : ''}
                />
                {errors.correo_electronico && (
                  <p className="text-xs text-red-600">
                    {errors.correo_electronico.message}
                  </p>
                )}
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contrasena">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => setModalRecuperarAbierto(true)}
                    className="text-xs text-[#312e81] hover:underline focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input
                  id="contrasena"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={enviando}
                  {...register('contrasena')}
                  className={errors.contrasena ? 'border-red-500' : ''}
                />
                {errors.contrasena && (
                  <p className="text-xs text-red-600">
                    {errors.contrasena.message}
                  </p>
                )}
              </div>

              {/* Botón de envío */}
              <Button
                type="submit"
                className="w-full bg-[#312e81] text-white hover:bg-[#4338ca]"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>

            {/* Bloque informativo de credenciales de prueba */}
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800 mb-1">Credenciales de prueba:</p>
              <p><span className="font-medium text-slate-700">Correo:</span> admin@prueba.com</p>
              <p><span className="font-medium text-slate-700">Contraseña:</span> administrador</p>
            </div>
          </CardContent>
        </Card>

        {/* Pie de página sutil */}
        <p className="text-center text-xs text-slate-400">
          Resolva &copy; {new Date().getFullYear()} — Todos los derechos reservados
        </p>
      </div>

      {/* Modal: Recuperar Contraseña */}
      <Dialog
        open={modalRecuperarAbierto}
        onOpenChange={(abierto) => !abierto && cerrarModalRecuperar()}
      >
        <DialogContent onClose={cerrarModalRecuperar}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#312e81]">
              <KeyRound className="h-5 w-5" />
              <DialogTitle>Recuperar Contraseña</DialogTitle>
            </div>
            <DialogDescription>
              Ingresa el correo electrónico asociado a tu cuenta para recibir un enlace de restablecimiento.
            </DialogDescription>
          </DialogHeader>

          {recuperacionExitosa ? (
            <div className="py-6 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-slate-900">
                  Enlace de recuperación enviado
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Si la dirección ingresada corresponde a una cuenta activa en el sistema, recibirás un correo con las instrucciones para crear una nueva clave.
                </p>
              </div>
              <Button
                type="button"
                onClick={cerrarModalRecuperar}
                className="mt-4 bg-[#312e81] text-white hover:bg-[#4338ca]"
              >
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitRecuperar(onSubmitRecuperar)} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="correo_recuperar">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="correo_recuperar"
                    type="email"
                    placeholder="usuario@empresa.com"
                    autoComplete="email"
                    disabled={enviandoRecuperacion}
                    {...registerRecuperar('correo_electronico')}
                    className={`pl-9 ${
                      errorsRecuperar.correo_electronico ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {errorsRecuperar.correo_electronico && (
                  <p className="text-xs text-red-600">
                    {errorsRecuperar.correo_electronico.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={enviandoRecuperacion}
                  onClick={cerrarModalRecuperar}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={enviandoRecuperacion}
                  className="bg-[#312e81] text-white hover:bg-[#4338ca]"
                >
                  {enviandoRecuperacion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando enlace...
                    </>
                  ) : (
                    'Enviar enlace'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Login;

