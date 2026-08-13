# Design: Ajustes finales — CRUD de concesionarios, capas flotantes, BD limpia y año 2026

Fecha: 2026-08-13
Estado: Aprobado

## Objetivo

Ejecutar los ajustes finales del CRM Mundo Motos:

1. **CRUD completo de concesionarios** en frontend y backend (Editar con `PUT` y Eliminar con
   confirmación previa), manteniendo la paleta corporativa (fondos oscuros/negros, acentos
   `#FFCC00`/`mm-yellow`, texto blanco).
2. **Corrección de capas flotantes / z-index** para que modales, overlay de carga y popups de
   Leaflet no se superpongan incorrectamente.
3. **Base de datos limpia** (sin datos semilla) y **auditoría del año 2026** (sustituir
   cualquier mención a 2024 u años anteriores).
4. Verificación: `tsc --noEmit` (backend y frontend) y `vite build` en verde.

## Decisiones tomadas

- **Semántica de baja**: *hard delete*. `DELETE /api/v1/concesionarios/:id` borra la fila; las
  `interacciones_crm` asociadas se eliminan en cascada (`ON DELETE CASCADE` en la migración 002).
- **Ubicación de acciones**: botones ✏️ Editar y 🗑️ Eliminar visibles directamente en cada fila
  del listado de `DashboardConcesionarios`.
- **Confirmación**: modal propio `ConfirmarEliminacionModal` (identidad corporativa), no
  `window.confirm`.
- **Limpieza de BD**: se editan `003_expansiones.sql` y `seeds/001_...sql` (sin INSERTs) y se
  crea la migración `005_limpiar_datos_semilla.sql` idempotente, que se aplica al proyecto
  Supabase remoto `zpjoneyojbtutszvwyxg`.
- **Año 2026**: se sustituye "2024" en código de la app y documentación versionada. **No se
  tocan** los `ES2020`/`es2021` de tsconfig/eslintrc (son versiones de ECMAScript, no fechas).
  Se excluyen `.superpowers/` y `.claude/` (carpetas no versionadas).

## Arquitectura

### 1. Backend — endpoint de baja

- `src/modules/concesionarios/concesionario.service.ts`: `deleteConcesionario(id)` → valida id,
  ejecuta `.delete()` de Supabase sobre la fila (404 si no existe), sin soft delete.
- `src/modules/concesionarios/concesionario.controller.ts`: handler `deleteConcesionario` que
  responde `sendSuccess` (204 semántico → se mantiene el estilo `sendSuccess` del módulo).
- `src/modules/concesionarios/concesionario.routes.ts`: `concesionariosRouter.delete('/:id', ...)`.

### 2. Frontend — CRUD

- `src/services/api.ts`: `deleteConcesionario(id)` → `DELETE /concesionarios/:id`.
- `src/components/ConcesionarioModal.tsx`: modo dual **Crear/Editar**.
  - Nueva prop `concesionario?: Concesionario | null`.
  - Si viene, precarga el formulario (nombre, razón social, NIT, email, teléfono, estado,
    ciudad, departamento, dirección, lat/lng), título "Editar concesionario", y al enviar
    ejecuta `PUT /concesionarios/:id`.
  - Si no viene, comportamiento actual (crear con `POST`).
- `src/components/ConfirmarEliminacionModal.tsx` (nuevo): modal `fixed inset-0 z-50`, fondo
  negro, panel `bg-mm-gray-900`, borde `mm-gray-600` y acento amarillo; botón destructivo en
  rojo corporativo (`bg-mm-error`). Props: `abierto`, `concesionario`, `eliminando`, `onCancelar`,
  `onConfirmar`.
- `src/components/DashboardConcesionarios.tsx`: cada `<li>` pasa de `<button>` único a una fila
  con área principal clicable (selección/detalle) + botones de acción con `stopPropagation`.

### 3. Z-index / capas flotantes

- Contenedor del mapa Leaflet en el dashboard: añadir `z-0` (crea *stacking context* propio y
  aísla los panes de Leaflet, z 400–800, para que no tapen modales `z-50`).
- Overlay "Cargando concesionarios...": `z-[1000]` para quedar sobre markers/popups del mapa.
- Mini-mapa del modal: `z-0` por consistencia (los modales ya crean su propio contexto).
- Modales: todos `fixed inset-0 z-50`. Toaster (`react-hot-toast`): z-index 9999 por defecto.

### 4. Base de datos y año 2026

- `src/database/migrations/003_expansiones.sql`: se elimina el bloque `INSERT` semilla (6 filas).
- `src/database/seeds/001_usuarios_concesionarios_interacciones.sql`: se vacía el contenido
  (archivo de referencia con comentario de arranque en blanco, sin INSERTs).
- `src/database/migrations/005_limpiar_datos_semilla.sql` (nuevo): `DELETE` idempotente en orden
  FK-safe (`expansiones`, `interacciones_crm`, `concesionarios`, `users`).
- Aplicación remota: `supabase_apply_migration` sobre `zpjoneyojbtutszvwyxg`.
- Barrido 2024 → 2026: `App.tsx` (footer), `README.md`, `PROYECTO_RESUMEN.md`,
  `PRIMEROS_PASOS.md`, `docs/api-endpoints.md`, `docs/base-de-datos.md`.

## Error handling

- `deleteConcesionario`: `ApiError(404)` si el id no existe; errores de Supabase mapeados con
  `mapSupabaseError`. El frontend muestra toast de error y conserva el listado si falla.
- El modal de edición reutiliza el manejo de errores actual (mensaje inline + toast).

## Verificación

- `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`
- `npx.cmd tsc --noEmit -p tsconfig.app.json` (frontend)
- `npm.cmd run build --workspace=@mundo-motos/frontend` (tsc + vite build)
