/**
 * Página para establecer o restablecer la contraseña de un usuario.
 * Procesa tokens de invitación y recuperación provenientes de enlaces mágicos de Supabase Auth.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSupabase } from '@/lib/supabase';
import {
  esquemaEstablecerPassword,
  EstablecerPasswordEntrada,
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
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente de página para definir una nueva contraseña.
 * Verifica la validez del token en la URL, permite ingresar las credenciales y actualiza
 * la cuenta del usuario en Supabase Auth, redirigiendo a la bandeja principal si tiene éxito.
 */
export function EstablecerPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados de control de flujo
  const [verificandoToken, setVerificandoToken] = useState<boolean>(true);
  const [tokenValido, setTokenValido] = useState<boolean>(false);
  const [errorToken, setErrorToken] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  // Configuración de formulario con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EstablecerPasswordEntrada>({
    resolver: zodResolver(esquemaEstablecerPassword),
    defaultValues: {
      password: '',
      confirmar_password: '',
    },
  });

  /**
   * Efecto de inicialización: Detecta el estado de la sesión o parámetros de error en la URL.
   * 
   * Flujo y decisiones de diseño:
   * 1. Supabase inserta parámetros de error en el Hash (#error=...) o en Search (?error=...) si el enlace expiró.
   * 2. Si no hay error explícito, el SDK de Supabase parsea el token y dispara PASSWORD_RECOVERY o SIGNED_IN.
   * 3. Consultamos clienteSupabase.auth.getSession() para confirmar si existe una sesión activa y válida.
   */
  useEffect(() => {
    let montado = true;

    // 1. Analizar si la URL contiene errores emitidos por Supabase
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const searchParams = new URLSearchParams(location.search);

    const errorEnHash = hashParams.get('error') || hashParams.get('error_description');
    const errorEnSearch = searchParams.get('error') || searchParams.get('error_description');
    const codigoError = hashParams.get('error_code') || searchParams.get('error_code');

    if (errorEnHash || errorEnSearch || codigoError === 'otp_expired') {
      if (montado) {
        setErrorToken(
          'El enlace de acceso ha expirado o no es válido. Por favor solicita uno nuevo.'
        );
        setTokenValido(false);
        setVerificandoToken(false);
      }
      return;
    }

    // 2. Escuchar eventos de autenticación de Supabase para capturar la sesión del token
    const {
      data: { subscription },
    } = clienteSupabase.auth.onAuthStateChange((evento, session) => {
      if (!montado) return;

      if (evento === 'PASSWORD_RECOVERY' || (session && (evento === 'SIGNED_IN' || evento === 'INITIAL_SESSION'))) {
        setTokenValido(true);
        setErrorToken(null);
        setVerificandoToken(false);
      }
    });

    // 3. Comprobación directa de sesión existente (en caso de que el SDK ya haya procesado el hash)
    const verificarSesionInicial = async () => {
      try {
        const { data: { session }, error } = await clienteSupabase.auth.getSession();
        if (!montado) return;

        if (error) {
          setErrorToken('No fue posible validar el enlace. Intenta solicitar uno nuevo.');
          setTokenValido(false);
        } else if (session) {
          setTokenValido(true);
          setErrorToken(null);
        } else {
          // Si tras un breve retardo no hay sesión ni evento, el enlace no contiene credenciales
          setTimeout(() => {
            if (montado && !tokenValido) {
              setVerificandoToken((actual) => {
                if (actual) {
                  setErrorToken('No se detectó una sesión de recuperación o invitación válida.');
                }
                return false;
              });
            }
          }, 1500);
          return;
        }
      } catch (err) {
        if (montado) {
          setErrorToken('Ocurrió un error al verificar la sesión.');
          setTokenValido(false);
        }
      } finally {
        if (montado) {
          setVerificandoToken(false);
        }
      }
    };

    verificarSesionInicial();

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, [location, tokenValido]);

  /**
   * Envía la nueva contraseña a Supabase Auth mediante updateUser.
   * Al ser exitoso, mantiene la sesión autenticada y redirige al usuario a /tickets.
   */
  const onSubmit = async (valores: EstablecerPasswordEntrada) => {
    setErrorServidor(null);
    setEnviando(true);

    try {
      // 1. Actualizar la contraseña del usuario en Supabase Auth
      const { error } = await clienteSupabase.auth.updateUser({
        password: valores.password,
      });

      if (error) {
        throw error;
      }

      // 2. Notificar al usuario y redirigir a la plataforma
      toast.success('Contraseña configurada con éxito. Bienvenido al sistema.');
      navigate('/tickets', { replace: true });
    } catch (err: any) {
      console.error('Error al actualizar la contraseña:', err);
      const mensaje =
        err?.message || 'No fue posible actualizar tu contraseña. Intenta nuevamente.';
      setErrorServidor(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  // Vista 1: Verificando enlace
  if (verificandoToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#312e81]" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Verificando enlace de acceso...
        </p>
      </div>
    );
  }

  // Vista 2: Enlace inválido o expirado
  if (!tokenValido || errorToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 shadow-sm">
              <ShieldX className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Enlace no disponible
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              El enlace para configurar tu contraseña es inválido o ha caducado
            </p>
          </div>

          <Card className="border-slate-200 shadow-md">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <p>{errorToken || 'Este enlace ya no es válido o ya fue utilizado.'}</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#312e81] text-white hover:bg-[#4338ca]"
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vista 3: Formulario para ingresar la nueva contraseña
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Encabezado con identidad Resolva */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#312e81] text-white shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Establecer Contraseña
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Define tu clave de acceso para ingresar a la plataforma de tickets
          </p>
        </div>

        {/* Tarjeta con formulario */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-[#312e81]">
              Nueva Contraseña
            </CardTitle>
            <CardDescription>
              Ingresa una contraseña segura de al menos 6 caracteres
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorServidor && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorServidor}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Campo Contraseña */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={enviando}
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Campo Confirmar Contraseña */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmar_password">Confirmar contraseña</Label>
                <Input
                  id="confirmar_password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={enviando}
                  {...register('confirmar_password')}
                  className={errors.confirmar_password ? 'border-red-500' : ''}
                />
                {errors.confirmar_password && (
                  <p className="text-xs text-red-600">
                    {errors.confirmar_password.message}
                  </p>
                )}
              </div>

              {/* Botón de confirmación */}
              <Button
                type="submit"
                className="w-full bg-[#312e81] text-white hover:bg-[#4338ca] shadow"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando contraseña...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Guardar y continuar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-xs text-slate-500 hover:text-[#312e81] transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EstablecerPassword;
