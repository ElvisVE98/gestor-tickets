/**
 * Componente Raíz de la Aplicación (App)
 * Configura el proveedor global de autenticación, el enrutador de React Router,
 * los guardias de acceso (públicos y protegidos), el Layout corporativo y el contenedor global de notificaciones.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RutaProtegida } from '@/components/RutaProtegida'
import { RutaPublica } from '@/components/RutaPublica'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { EstablecerPassword } from '@/pages/EstablecerPassword'
import { Tickets } from '@/pages/Tickets'
import { DetalleTicket } from '@/pages/DetalleTicket'
import { CrearTicket } from '@/pages/CrearTicket'
import { Usuarios } from '@/pages/Usuarios'
import { Toaster } from '@/components/ui/sonner'

/**
 * Vista de fallback para rutas no existentes en la aplicación (Error 404).
 */
function PaginaNoEncontrada() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#312e81]">404</h1>
        <p className="mt-2 text-gray-600">Página no encontrada</p>
      </div>
    </div>
  )
}

/**
 * Componente principal que estructura y renderiza las rutas de la plataforma.
 */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirección inicial hacia el panel principal de tickets */}
          <Route path="/" element={<Navigate to="/tickets" replace />} />

          {/* Ruta pública (sin layout/sidebar, redirige a /tickets si ya hay sesión activa) */}
          <Route
            path="/login"
            element={
              <RutaPublica>
                <Login />
              </RutaPublica>
            }
          />

          {/* Ruta libre para completar registro o restablecer contraseña (sin guards) */}
          <Route path="/establecer-password" element={<EstablecerPassword />} />

          {/* Rutas protegidas anidadas dentro del Layout corporativo */}
          <Route
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            {/* Accesibles para cualquier usuario autenticado y activo */}
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/nuevo" element={<CrearTicket />} />
            <Route path="/tickets/:id" element={<DetalleTicket />} />

            {/* Accesible únicamente para usuarios con rol administrador */}
            <Route
              path="/usuarios"
              element={
                <RutaProtegida rolesPermitidos={['administrador']}>
                  <Usuarios />
                </RutaProtegida>
              }
            />
          </Route>

          {/* Ruta comodín 404 para URLs no encontradas */}
          <Route path="*" element={<PaginaNoEncontrada />} />
        </Routes>
      </BrowserRouter>
      {/* Contenedor global de notificaciones toast */}
      <Toaster position="top-right" richColors />
    </AuthProvider>
  )
}

export default App
