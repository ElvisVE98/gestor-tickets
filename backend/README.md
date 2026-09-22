# Backend — API REST de Curifor Tickets

Servicio backend en Node.js y Express con TypeScript para la plataforma interna de tickets de soporte de Curifor. Se conecta a Supabase mediante la clave administrativa `service_role` y provee endpoints REST protegidos por autenticación Bearer y autorización basada en roles (RBAC).

---

## 1. Variables de Entorno

Crear un archivo `.env` en la carpeta `backend/` a partir de `.env.ejemplo`:

```env
PUERTO=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173,https://curifor-tickets.netlify.app
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Detalle de Variables

| Variable | Tipo | Descripción | Valor por Defecto |
| :--- | :--- | :--- | :--- |
| `PUERTO` | Número | Puerto en el que escucha el servidor HTTP | `3000` |
| `NODE_ENV` | Enum (`development` \| `production` \| `test`) | Entorno de ejecución | `development` |
| `FRONTEND_URL` | String (URLs separadas por coma) | Orígenes autorizados para CORS | *Obligatorio* |
| `SUPABASE_URL` | URL | URL del proyecto Supabase | *Obligatorio* |
| `SUPABASE_SERVICE_ROLE_KEY` | String | Clave `service_role` de Supabase para acceso administrativo | *Obligatorio* |

---

## 2. Instalación y Ejecución

### Requisitos
- Node.js 18+ (recomendado 20+)
- npm

### Comandos de Ejecución

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Iniciar en modo desarrollo con recarga en caliente
npm run dev

# 3. Compilar TypeScript a JavaScript (dist/)
npm run build

# 4. Iniciar en producción (requiere build previo)
npm start

# 5. Ejecutar tests unitarios y de integración
npm test
```

---

## 3. Catálogo Completo de Endpoints REST

Todos los endpoints (excepto `/api/health`) requieren cabecera `Authorization: Bearer <token_jwt_supabase>` y cuenta con estado `activo = true`.

### Salud
- `GET /api/health`: Estado del servicio (público).

### Usuarios y Perfiles (`/api/usuarios`)
- `GET /api/usuarios/yo`: Retorna el perfil completo del usuario autenticado actual.
  - *Acceso:* Todos los roles (`solicitante`, `soporte`, `administrador`).
- `GET /api/usuarios/agentes`: Retorna la lista de técnicos habilitados para asignación.
  - *Acceso:* `soporte`, `administrador`.
- `GET /api/usuarios`: Retorna la lista de todos los colaboradores registrados.
  - *Acceso:* `administrador`.
- `POST /api/usuarios/invitar`: Envía invitación por correo vía Supabase Auth y crea el perfil inicial en BD.
  - *Acceso:* `administrador`.
  - *Body:* `{ "nombre_completo": string, "correo_electronico": string }`
- `PATCH /api/usuarios/:id/rol`: Actualiza el rol del colaborador.
  - *Acceso:* `administrador`.
  - *Body:* `{ "rol": "solicitante" | "soporte" | "administrador" }`
- `PATCH /api/usuarios/:id/desactivar`: Realiza la baja lógica de la cuenta.
  - *Acceso:* `administrador` (bloquea auto-desactivación del propio administrador).

### Tickets (`/api/tickets`)
- `GET /api/tickets`: Listado paginado de tickets con soporte de filtros.
  - *Acceso:* Todos los roles (el `solicitante` solo ve sus propios tickets; `soporte` y `administrador` tienen visibilidad global).
  - *Query params:*
    - `pagina` (número, default `1`)
    - `limite` (número, default `20`, máx `100`)
    - `estado` (`abierto` \| `en_progreso` \| `resuelto` \| `cerrado`)
    - `categoria` (`erp_flexline` \| `rindegasto` \| `soporte_ti` \| `solicitud_desarrollo` \| `otro`)
    - `prioridad` (`baja` \| `media` \| `alta` \| `urgente`)
    - `asignado` (`asignado` \| `sin_asignar`)
    - `buscar` (búsqueda por texto en título o folio exacto)
  - *Respuesta:* `{ tickets: TicketEntidad[], total: number, pagina: number, limite: number, total_paginas: number }`
- `GET /api/tickets/metricas`: Conteo global de KPIs para el panel de soporte (`sinAsignar`, `abiertos`, `enProgreso`, `urgentesActivos`).
  - *Acceso:* `soporte`, `administrador`.
- `GET /api/tickets/:id`: Consulta de detalle completo de un ticket.
  - *Acceso:* Todos los roles (validación de propiedad para solicitantes).
- `POST /api/tickets`: Creación de un nuevo ticket (estado inicial forzado en `abierto`).
  - *Acceso:* Todos los roles.
  - *Body:* `{ "titulo": string, "descripcion": string, "categoria": string, "prioridad": string }`
- `PATCH /api/tickets/:id/estado`: Cambio de estado con registro automático de auditoría en `historial_ticket`.
  - *Acceso:* `soporte`, `administrador`.
  - *Body:* `{ "estado": "abierto" | "en_progreso" | "resuelto" | "cerrado" }`
- `PATCH /api/tickets/:id/asignacion`: Asignación o desasignación de un técnico responsable.
  - *Acceso:* `soporte`, `administrador`.
  - *Body:* `{ "asignado_a_id": string | null }`
- `GET /api/tickets/:id/historial`: Lista cronológica de cambios de estado del ticket.
  - *Acceso:* Todos los roles (con visibilidad sobre el ticket).

### Comentarios (`/api/tickets/:id/comentarios`)
- `GET /api/tickets/:id/comentarios`: Lista cronológica de comentarios del ticket.
  - *Acceso:* Todos los roles (con visibilidad sobre el ticket).
- `POST /api/tickets/:id/comentarios`: Publica un comentario en el ticket.
  - *Acceso:* Todos los roles (con visibilidad sobre el ticket).
  - *Body:* `{ "contenido": string }`

### Archivos Adjuntos (`/api/tickets/:id/adjuntos`)
- `GET /api/tickets/:id/adjuntos`: Lista de metadatos de archivos adjuntos del ticket.
  - *Acceso:* Todos los roles (con visibilidad sobre el ticket).
- `POST /api/tickets/:id/adjuntos`: Sube un archivo binario adjunto a Supabase Storage privado.
  - *Acceso:* Todos los roles (con visibilidad sobre el ticket).
  - *Formato:* `multipart/form-data` con campo `archivo` (máximo 5 MB, formatos: JPG, PNG, WEBP, PDF).
- `GET /api/tickets/:id/adjuntos/:idAdjunto/descargar`: Genera una URL prefirmada temporal de descarga (5 minutos de vigencia).
  - *Acceso:* Todos los roles (con visibilidad sobre el ticket).

---

## 4. Estructura del Código

```text
backend/
├── src/
│   ├── config/               # Variables de entorno validadas con Zod y cliente Supabase
│   ├── controllers/          # Manejadores de solicitudes HTTP (req/res)
│   ├── errors/               # Errores de dominio personalizados (ErrorApp, ErrorNoEncontrado)
│   ├── middlewares/          # Autenticación JWT, control de roles (RBAC), multer y validación Zod
│   ├── repositories/         # Capa de acceso a datos directa a Supabase (PostgREST y Storage)
│   ├── routes/               # Definición y montaje de rutas REST de Express
│   ├── schemas/              # Esquemas de validación Zod para payloads y query params
│   ├── services/             # Lógica de negocio, transacciones compensatorias y auditoría
│   ├── types/                # Definiciones de TypeScript y constantes compartidas
│   ├── app.ts                # Configuración de Express, CORS y middlewares
│   └── servidor.ts           # Inicialización y escucha en el puerto configurado
├── tests/                    # Suites de pruebas automatizadas (Jest / Supertest)
├── .env.ejemplo              # Plantilla de variables de entorno requeridas
├── package.json              # Dependencias y scripts
└── tsconfig.json             # Configuración del compilador TypeScript
```
