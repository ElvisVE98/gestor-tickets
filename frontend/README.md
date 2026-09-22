# Frontend — Aplicación Web de Curifor Tickets

Interfaz web para la plataforma de gestión de tickets de soporte interno de Curifor, construida con React 19, TypeScript, Vite, Tailwind CSS y componentes de UI basados en shadcn/ui.

---

## 1. Variables de Entorno

Crear un archivo `.env` en la raíz de `frontend/` a partir de `.env.ejemplo`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Detalle de Variables

| Variable | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | URL | URL base de la API backend de Express | `http://localhost:3000/api` |
| `VITE_SUPABASE_URL` | URL | Endpoint público del proyecto Supabase | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | String | Clave anónima pública (`anon key`) de Supabase para autenticación en el cliente | `eyJhbGciOi...` |

---

## 2. Instalación y Ejecución

### Requisitos
- Node.js 18+ (recomendado 20+)
- npm

### Comandos de Ejecución

```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Iniciar servidor de desarrollo (Vite)
npm run dev

# 3. Compilar bundle de producción (tsc y vite build)
npm run build

# 4. Previsualizar el build de producción localmente
npm run preview
```

---

## 3. Mapa de Rutas y Control de Acceso (RBAC)

La aplicación utiliza `react-router-dom` con guardias de navegación (`RutaProtegida` y `RutaPublica`) para garantizar que cada colaborador solo acceda a las vistas permitidas según su rol (`solicitante`, `soporte`, `administrador`):

| Ruta | Guardia | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `/login` | `RutaPublica` | Anónimo (sin sesión) | Inicio de sesión con correo y contraseña. Incluye modal para solicitar recuperación. Si ya hay sesión activa, redirige automáticamente a `/tickets`. |
| `/establecer-password` | Pública libre | Todos (con token) | Vista libre (sin guardias) para definir contraseña tras recibir una invitación o enlace de recuperación por correo. Al completar, redirige a `/tickets`. |
| `/tickets` | `RutaProtegida` | `solicitante`, `soporte`, `administrador` | Bandeja principal de tickets paginada. Los solicitantes ven sus solicitudes y chips rápidos; soporte y administradores ven la bandeja global con KPIs y filtros avanzados. |
| `/tickets/nuevo` | `RutaProtegida` | `solicitante`, `soporte`, `administrador` | Formulario de registro de nuevas solicitudes con validación Zod y selector de chips de prioridad. |
| `/tickets/:id` | `RutaProtegida` | `solicitante`, `soporte`, `administrador` | Detalle del ticket en 2 columnas: descripción, conversación (`HiloComentarios`), panel técnico (`PanelGestionTicket`), archivos (`PanelAdjuntosTicket`) e historial (`PanelHistorialTicket`). |
| `/usuarios` | `RutaProtegida` | `administrador` | Panel de gestión de personal: tabla de colaboradores, invitación vía Magic Link, modificación de roles y baja lógica de cuentas. |
| `*` | Libre | Todos | Pantalla 404 para rutas inexistentes. |

---

## 4. Estructura de Carpetas

```text
frontend/
├── src/
│   ├── api/                  # Clientes Axios y funciones de consumo HTTP para tickets y usuarios
│   ├── components/           # Componentes visuales reutilizables
│   │   ├── tickets/          # Subcomponentes modulares de tickets (HiloComentarios, paneles, badges)
│   │   ├── ui/               # Componentes base de diseño (Button, Card, Input, Dialog, Table, Sonner)
│   │   ├── usuarios/         # Diálogos y modales de personal (Invitar, Cambiar Rol, Desactivar)
│   │   ├── Layout.tsx        # Shell visual con Sidebar responsivo y cabecera
│   │   ├── RutaProtegida.tsx # Guardia de autenticación y verificación de roles permitidos
│   │   └── RutaPublica.tsx   # Guardia inversa para vistas públicas (Login)
│   ├── context/              # AuthContext para sesión global, tokens y perfil en memoria
│   ├── hooks/                # Custom hooks (useTickets con paginación, useDetalleTicket, useUsuarios)
│   ├── lib/                  # Clientes singleton (Supabase), formateadores y utilidades CSS
│   ├── pages/                # Vistas de página principales (Login, Tickets, DetalleTicket, etc.)
│   ├── schemas/              # Esquemas de validación Zod (login, ticket, usuario, password)
│   ├── types/                # Definiciones de tipos TypeScript compartidas
│   ├── App.tsx               # Configuración central de rutas y contenedor Toaster
│   ├── main.tsx              # Punto de montaje de React en el DOM
│   └── index.css             # Estilos globales y directivas de Tailwind CSS
├── index.html                # Plantilla HTML base
├── package.json              # Dependencias del proyecto
├── tailwind.config.js        # Configuración de colores y tokens de diseño
└── tsconfig.json             # Configuración de TypeScript
```
