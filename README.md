# Curifor Tickets — Sistema de Soporte Interno

Plataforma web centralizada para la gestión, seguimiento y resolución de solicitudes de soporte técnico y requerimientos operativos en Curifor. Reemplaza el canal informal por correo y mensajería por una mesa de ayuda estructurada, con trazabilidad completa, control de acceso por roles (RBAC) y auditoría histórica.

---

## 1. Stack Tecnológico

* **Backend:** Node.js, Express, TypeScript, Zod (validación de esquemas), Multer (manejo de adjuntos en memoria), Jest y Supertest.
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide React, Sonner (notificaciones toast) y React Hook Form con Zod.
* **Base de Datos y Autenticación:** Supabase (PostgreSQL relacional, Supabase Auth con Magic Links/Tokens y Supabase Storage con buckets privados y URLs firmadas temporales).

---

## 2. Estructura del Repositorio

El proyecto está organizado como un monorepo simple con separación clara entre backend, frontend y documentación técnica:

```text
Curifor-Tickets/
├── backend/                  # Servicio API REST en Express y TypeScript
│   ├── src/                  # Controladores, servicios, repositorios, middlewares y esquemas
│   ├── tests/                # Pruebas automatizadas de integración y endpoints
│   ├── package.json          # Dependencias y scripts del backend
│   └── README.md             # Guía técnica detallada y catálogo de endpoints del backend
├── frontend/                 # Aplicación cliente en React 19 y Vite
│   ├── src/                  # Páginas, componentes modulares, hooks, contextos y estilos
│   ├── package.json          # Dependencias y scripts del frontend
│   └── README.md             # Guía técnica de instalación y mapa de rutas del frontend
├── docs/                     # Documentación de arquitectura, decisiones y esquema de base de datos
│   ├── Decisiones.md         # Registro de decisiones de diseño y lecciones aprendidas
│   └── schema.sql            # Definición DDL de tablas, índices, enums y triggers de PostgreSQL
└── README.md                 # Este archivo (visión general del proyecto)
```

---

## 3. Guías de Instalación y Puesta en Marcha

Para instrucciones detalladas sobre variables de entorno, configuración y ejecución de cada componente, consulta sus guías específicas:

- ⚙️ **[Guía y Catálogo de Endpoints del Backend](./backend/README.md)**
- 💻 **[Guía y Mapa de Rutas del Frontend](./frontend/README.md)**

---

## 4. Roles y Permisos del Sistema

El sistema implementa tres roles de usuario con permisos segmentados:

1. **`solicitante`:** Cualquier colaborador de Curifor. Puede crear tickets, visualizar y filtrar únicamente sus propias solicitudes, publicar comentarios y adjuntar/descargar archivos.
2. **`soporte`:** Equipo técnico de mesa de ayuda. Tiene visibilidad global de todos los tickets, acceso al panel con KPIs métricas (`Sin asignar`, `Abiertos`, `En progreso`, `Urgentes activos`), capacidad de cambiar estados y autoasignarse o derivar tickets entre técnicos.
3. **`administrador`:** Jefatura técnica / TI. Incluye todos los permisos de soporte más el módulo exclusivo de administración de personal (`/usuarios`) para invitar nuevos usuarios, reasignar roles y desactivar cuentas.
