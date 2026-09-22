# Decisiones de Arquitectura — Tiquetera Curifor

Registro de decisiones técnicas y de negocio, con el porqué detrás de cada una.
No es documentación de "qué hace el código" (eso vive en los README) — es el
"por qué se hizo así y no de otra forma", para no perder el contexto en el futuro.

---

## ⚠️ Bloqueante antes de invitar a toda la empresa

**Límite de 2 correos/hora sin SMTP propio, incluso en plan Pro**
Confirmado en Authentication → Rate Limits de Supabase: el límite de envío
de correos de Auth (invitaciones, recuperación de contraseña) es de 2/hora
por defecto, y NO sube automáticamente con el plan de pago — solo se
aumenta configurando SMTP propio (Authentication → Emails → SMTP Settings).
Con ~400 personas en Curifor, esto hace inviable el rollout completo sin
resolver el SMTP primero. Ya no es "mejora de branding" — es requisito
bloqueante para cualquier despliegue a más de un puñado de usuarios.

**Plan para resolverlo — SMTP de Curifor, no un servicio externo**
Se prefiere SMTP corporativo (vía nodemailer en el backend, y en el SMTP
Settings de Supabase) porque evita depender de un tercero, reutiliza
credenciales corporativas ya existentes, y da correos desde @curifor.com.
Solo se recurriría a un servicio externo (ej. Resend) si Microsoft 365
tuviera SMTP AUTH bloqueado sin posibilidad de habilitarlo para una cuenta
de servicio.

Pendiente antes de implementar: conseguir credenciales SMTP de una cuenta
de servicio de Curifor (ej. notificaciones@curifor.com) con SMTP AUTH
habilitado — requiere permisos de administrador del tenant Microsoft 365.

## Pendiente: notificaciones por correo (fase futura, depende del SMTP)

**Dos mecanismos separados, mismas credenciales una vez resuelto el SMTP**
1. SMTP Settings de Supabase — solo afecta correos que Supabase Auth genera
   solo (invitación, reset de contraseña). Configuración, no código.
2. nodemailer en el backend — para notificaciones propias de la plataforma
   (comentario nuevo, cambio de estado). Una función enviarCorreo()
   reutilizable, llamada desde los servicios existentes sin bloquear la
   respuesta si el envío falla.

**Eventos a notificar (definido, no implementado):**
- Al solicitante: nuevo comentario de soporte, cambio de estado (especialmente
  a resuelto/cerrado)
- A soporte: ticket nuevo sin asignar, nuevo comentario del solicitante en un
  ticket ya asignado
- No notificar cada cambio menor (ej. prioridad) para no recrear el ruido de
  correo que la plataforma busca reemplazar

## Otros pendientes / mejoras futuras (no bloqueantes)

- Validar que el `id` recibido en `PATCH /api/tickets/:id/asignacion`
  corresponda a un usuario real con rol `soporte`/`administrador` y `activo`.
- Distinguir error técnico (500) real de "no encontrado" cuando falla la
  consulta a `usuarios` en el middleware de autenticación (hoy ambos casos
  devuelven 403 por igual).
- Definir si un ticket "cerrado" que se reabre pasa a `abierto` de nuevo o
  necesita un estado `reabierto` propio (por ahora, el historial ya registra
  el cambio sin tocar el esquema).

---

## Base de datos

**`usuarios.id` no genera su propio UUID — referencia `auth.users(id)`**
No duplicamos identidad. Supabase Auth maneja login/contraseñas; nuestra tabla
solo guarda el perfil (nombre, rol, estado activo). Evita reconstruir
autenticación desde cero.

**Soft delete (`activo: boolean`), nunca `DELETE`**
Cuando alguien se desvincula, se marca `activo = false`, no se borra la fila.
Un ticket, comentario o historial nunca debe perder la trazabilidad de quién
lo generó, aunque esa persona ya no trabaje en Curifor.

**`historial_ticket` se llena desde la capa de servicio, no con trigger de BD**
Un trigger no sabe quién es el usuario autenticado que hizo el cambio — solo ve
que la fila cambió. El servicio sí tiene ese dato disponible, así que inserta
el historial explícitamente junto con `modificado_por_id`.

**`asignado_a_id` es nullable**
Un ticket puede nacer sin asignar. Cualquiera de soporte puede autoasignarse, o
un administrador lo asigna explícitamente — no es obligatorio al crear.

**Categorías separadas de estado y de asignación**
Al revisar cómo Curifor clasificaba hoy sus correos, vimos que mezclaban cuatro
conceptos distintos (estado, prioridad, categoría real, persona asignada) en
una sola etiqueta de Outlook. Se separaron en columnas distintas para evitar
ese mismo problema en la plataforma.

**`folio` (SERIAL) como columna adicional, UUID se mantiene como clave interna**
Los UUID no son legibles ni memorizables para los usuarios. Se agregó `folio`
como columna autoincremental de Postgres (`SERIAL`), mostrada en el frontend
como `CUR-0001` (prefijo + 4 dígitos con padding). El `id` (UUID) sigue siendo
la clave primaria real y lo que usan las rutas de la API y las foreign keys —
`folio` es solo para mostrar al usuario. Es buscable en el filtro de listado
de tickets (implementado junto con la paginación).

## Seguridad

**RLS activado, sin políticas definidas**
El backend usa `SUPABASE_SERVICE_ROLE_KEY`, que ignora RLS siempre. Activar RLS
sin políticas es una red de seguridad: si algo llegara a usar la `anon key`
directo contra Supabase (por error o cambio futuro), no traería ningún dato en
vez de exponer todo.

**Sin autorregistro — usuarios se crean por invitación del administrador**
Es una herramienta interna de Curifor, no un producto público. Invitar
(`inviteUserByEmail`) da control total sobre quién entra, sin necesidad de un
flujo de aprobación aparte.

**Dominio de correo restringido a `@curifor.com`**
Validado en dos capas: esquema Zod (experiencia de uso) y CHECK constraint en
la tabla `usuarios` (respaldo si algo se inserta fuera del flujo normal).

**Detalle de ticket ajeno devuelve 404, no 403**
Para un `solicitante` que intenta ver/comentar un ticket que no es suyo, se
responde "no encontrado" en vez de "sin permiso", para no confirmarle que el
ticket existe.

## Backend

**Transacción compensatoria (rollback manual) en cambio de estado**
El cliente `@supabase/supabase-js` no soporta transacciones multi-tabla vía
REST sin usar una función RPC. `cambiarEstadoTicketServicio` actualiza el
ticket y luego inserta el historial; si el historial falla, revierte el
ticket a su estado anterior manualmente. Riesgo aceptado: si la reversión
también fallara, el error de esa segunda falla reemplazaría al original —
no resuelto, evaluado y aceptado por ahora.

**Workaround de certificado TLS para la red de Curifor**
`NODE_TLS_REJECT_UNAUTHORIZED = '0'` en `config/supabase.ts`, condicionado a
`entorno.NODE_ENV === 'development'`. El firewall corporativo de Curifor
intercepta HTTPS con un certificado autofirmado. Solo se activa en
desarrollo — nunca debe ejecutarse en producción.

**Convención de nombres: carpetas en inglés, contenido en español**
`config/`, `middlewares/`, `controllers/`, `services/`, `repositories/`,
`schemas/`, `types/`, `routes/` — nombres estándar de la industria. El
contenido (nombres de dominio, comentarios, mensajes de error) se mantiene
en español. Los archivos combinan ambos: `usuario.service.ts`.

**Roles definidos con patrón `as const` (no enum de TypeScript)**
`ROLES_USUARIO = [...] as const` en `usuario.type.ts` sirve de fuente única
para el tipo TypeScript y para los esquemas de Zod a la vez. Ojo: esto NO
sincroniza automáticamente con el enum `rol_usuario` de PostgreSQL — si se
agrega un rol nuevo en la base de datos, hay que actualizar este archivo
manualmente.

**`req.usuario!` en lugar de un tipo `RequestAutenticado` dedicado**
Se evaluó crear un tipo `RequestAutenticado` (usuario no opcional) para
eliminar las guardas `if (!req.usuario)` redundantes en los controladores
protegidos. Se descartó por un problema real de contravarianza de tipos con
`RequestHandler` de Express, que hubiera requerido type-casting en las
rutas. Se optó por la alternativa más simple: `req.usuario!.id` directo,
confiando en que `autenticacionMiddleware` garantiza el valor. Es una
promesa a nivel de tipos, no una verificación en tiempo de ejecución — si
una ruta nueva se monta sin el middleware, TypeScript no lo detecta.

## Gestión de usuarios

**Protección contra auto-desactivación del administrador**
`desactivarUsuarioServicio` bloquea (400) si el administrador intenta
desactivar su propia cuenta. Sin esto, si el único admin se desactiva por
error, nadie podría reactivarlo sin entrar directo a Supabase.

**Rollback en invitación de usuarios**
Mismo patrón de transacción compensatoria que cambio de estado: si falla la
inserción en la tabla `usuarios` después de crear el usuario en Supabase
Auth, se elimina ese usuario de Auth para no dejar una cuenta "fantasma".

**Detección de correo duplicado: código de estado, no texto del error**
Depende principalmente del código de estado HTTP (422), dejando la búsqueda
de texto en el mensaje solo como señal secundaria — el texto lo controla
Supabase y puede cambiar sin aviso.

## Adjuntos

**El archivo pasa por el backend, no se sube directo del frontend a Storage**
Se evaluaron dos opciones: subida directa con URLs firmadas (más eficiente,
pero introduce conceptos nuevos de seguridad de Storage) vs. que el archivo
pase por Express y se suba con la `service_role key` (más simple, reutiliza
el mismo patrón de capas del proyecto). Se eligió la segunda por volumen
bajo y consistencia arquitectónica.

**Bucket privado, con URLs firmadas de 5 minutos para descarga**
Los adjuntos pueden incluir documentos internos sensibles — no deben quedar
accesibles con un link público y fijo. La generación de la URL firmada pasa
por la misma validación de acceso que el resto del sistema (404 si el
ticket no es tuyo).

**Validación de tipo y tamaño en dos capas**
El backend valida tipo MIME (JPG, PNG, WEBP, PDF) y tamaño (5 MB) con
multer, y el bucket de Supabase Storage tiene los mismos límites como
respaldo.

**Organización de archivos en Storage por ticket**
Ruta `{ticket_id}/{timestamp}_{nombreArchivo}` — agrupa por ticket y evita
colisiones de nombre.

**Corrección de encoding en nombres de archivo (latin1 → utf8)**
Multer interpreta mal tildes y ñ en `originalname` por un problema conocido
con multipart/form-data. Se reconvierte el nombre antes de usarlo.

## Identificadores y relaciones legibles

**Join de `creador` y `asignado_a` en las consultas de tickets**
`SELECT_TICKET_CON_ASIGNADO` incluye ambos vía la relación de foreign key
de Supabase, evitando que el frontend tenga que cruzar IDs contra una lista
de usuarios cargada aparte (enfoque descartado por generar una llamada HTTP
redundante).

## Paginación y métricas

**Paginación por limit/offset en listado de tickets**
`pagina` y `limite` (default 20, máx 100) en `esquemaFiltrosTicket`.
`listarTickets` usa `.range()` con `{ count: 'exact' }` para devolver el
total en la misma consulta.

**Endpoint separado para métricas (`GET /api/tickets/metricas`)**
Las 4 tarjetas resumen del dashboard de soporte no pueden calcularse del
array paginado en memoria (solo representa la página actual). Se separó en
su propio endpoint con `{ count: 'exact', head: true }` — no transfiere
filas, solo cuenta.

## Contraseñas

**Flujo de completar registro / recuperación con página compartida**
Una sola página (`EstablecerPassword.tsx`) sirve tanto para "definir
contraseña por primera vez" como para "olvidé mi contraseña" — ambos casos
llegan por el mismo mecanismo de Supabase (link con token en la URL). Tras
`updateUser()`, Supabase deja la sesión ya iniciada, así que se redirige
directo a `/tickets`.

**Mensaje genérico en "olvidé mi contraseña"**
Práctica de seguridad estándar contra enumeración de cuentas: nunca se
confirma ni niega si el correo existe en el sistema.

## Frontend — patrones de React

**`useRef` en `AuthContext` para evitar stale closures**
El listener de `onAuthStateChange` se registra una sola vez en un
`useEffect`. Comparar contra el estado `usuario` directamente arriesga leer
un valor "congelado" del momento en que se montó el listener. `usuarioRef`
se mantiene sincronizado y se usa dentro del callback en su lugar.

**`SIGNED_IN` se dispara también al revalidar sesión por cambio de foco**
No solo en login real — Supabase re-emite `SIGNED_IN` al recuperar el foco
de la ventana, aunque sea la misma sesión. Se compara `session.user.id`
contra `usuarioRef.current?.id`: si coincide, se ignora el evento
silenciosamente (evita el parpadeo de "Verificando sesión" al cambiar de
pestaña); si es distinto o no hay usuario, se dispara el flujo completo de
carga.