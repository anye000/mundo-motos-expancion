# Design: Formulario de Concesionarios como método maestro y sincronización con Expansiones

Fecha: 2026-08-13
Estado: Aprobado

## Objetivo

Convertir el formulario de concesionarios (`ConcesionarioModal`) en el método
maestro de gestión centralizada del CRM: ampliar el modelo de concesionario con
estado operativo de 5 valores, fecha de apertura programada y tipo de expansión,
y sincronizar automáticamente cada concesionario con el módulo de expansiones
(cronograma), de forma que crear/editar alimente el calendario y eliminar lo
limpie de todas las vistas (concesionarios, mapa, dashboard gerencial y
cronograma). Verificación con `tsc`/`build` y despliegue con commit + push a `main`.

## Decisiones tomadas

1. **Sync solo para estados de expansión**: la expansión se crea/actualiza
   únicamente cuando `estado` es `proximo`, `en_ejecucion` o `completado` y hay
   `fecha_apertura_programada`. Si el estado es `activo`/`inactivo`, NO existe
   expansión vinculada: si existía una, se elimina (soft delete).
2. **Extender `estado` (no renombrar)**: la columna `concesionarios.estado` se
   amplía a 5 valores (`activo`, `inactivo`, `proximo`, `en_ejecucion`,
   `completado`). Se añaden las columnas `fecha_apertura_programada DATE NULL` y
   `tipo_expansion VARCHAR(80) NOT NULL DEFAULT 'apertura'`.
3. **FK `concesionario_id` en `expansiones`**: se añade `concesionario_id UUID NULL
   REFERENCES concesionarios(id) ON DELETE CASCADE`. La sincronización usa este id
   (robusto ante renombres). Se conserva `concesionario` (nombre) para la UI legacy
   y reportes. Backfill de filas existentes por coincidencia de nombre.
4. **Se mantiene el flujo manual** "Nueva Expansión" del cronograma
   (`ExpansionModal`) para expansiones no vinculadas (`concesionario_id NULL`).
5. **Aplicar la migración a producción** (proyecto Supabase
   `zpjoneyojbtutszvwyxg`) vía MCP después de pasar tsc/build.

## Esquema (migración `007_concesionarios_estado_expansion.sql`)

```sql
-- 1) Ampliar el CHECK de estado de concesionarios
ALTER TABLE concesionarios DROP CONSTRAINT concesionarios_estado_check;
ALTER TABLE concesionarios ADD CONSTRAINT concesionarios_estado_check
  CHECK (estado IN ('activo', 'inactivo', 'proximo', 'en_ejecucion', 'completado'));

-- 2) Nuevas columnas de concesionario
ALTER TABLE concesionarios
  ADD COLUMN fecha_apertura_programada DATE,
  ADD COLUMN tipo_expansion VARCHAR(80) NOT NULL DEFAULT 'apertura'
    CHECK (tipo_expansion IN ('apertura', 'ampliacion', 'relocalizacion', 'otro'));

-- 3) FK concesionario_id en expansiones + índice
ALTER TABLE expansiones
  ADD COLUMN concesionario_id UUID REFERENCES concesionarios(id) ON DELETE CASCADE;
CREATE INDEX idx_expansiones_concesionario_id ON expansiones(concesionario_id);

-- 4) Backfill por nombre (best-effort)
UPDATE expansiones e
  SET concesionario_id = c.id
  FROM concesionarios c
  WHERE c.nombre = e.concesionario AND c.deleted_at IS NULL
    AND e.concesionario_id IS NULL;
```

Nota: el DELETE físico de un concesionario elimina en cascada sus expansiones
vinculadas, limpiando el calendario. Las expansiones huérfanas (flujo manual) no
se ven afectadas.

## Backend

### Modelo (`concesionario.model.ts`)
- `EstadoOperativo = 'activo' | 'inactivo' | 'proximo' | 'en_ejecucion' | 'completado'`.
- `Concesionario`: añadir `fecha_apertura_programada: string | null` y
  `tipo_expansion: string`.
- `CreateConcesionarioInput`/`UpdateConcesionarioInput`: añadir
  `fecha_apertura_programada?: string | null` y `tipo_expansion?: string`.
- Mismo cambio en el tipo frontend `packages/frontend/src/types/concesionario.ts`.

### Servicio de expansiones (`expansion.service.ts`)
Nueva función `sincronizarExpansion(concesionario)`:
- Si `estado` ∈ expansión y `fecha_apertura_programada` válida:
  - Buscar expansión existente por `concesionario_id` (incluyendo soft-deleted).
  - Si existe (aunque esté soft-deleted) → restaurarla (`deleted_at = null`) y
    `update` (fecha, estado, tipo, `locacion = "ciudad, departamento"`, `ciudad`,
    `departamento`, `latitud`, `longitud`, `concesionario` = nombre). NO se pisan
    `avance`/`observaciones` (los gestiona el cronograma).
  - Si no existe → `create` con `avance` = 100 si `completado`, si no 0, más
    coordenadas y ubicación del concesionario.
- Si `estado` es `activo`/`inactivo` → soft delete de la expansión vinculada si
  existía.

Helpers internos: `getExpansionByConcesionarioId(id)`, `softDeleteExpansionById(id)`
para reutilizar desde la sincronización.

### Servicio de concesionarios (`concesionario.service.ts`)
- `createConcesionario`: tras insertar, validar los nuevos campos y llamar a
  `sincronizarExpansion`.
- `updateConcesionario`: tras actualizar, llamar a `sincronizarExpansion`.
- Validación: `fecha_apertura_programada` debe ser fecha válida (YYYY-MM-DD) o
  null; `tipo_expansion` uno de los 4 valores; `estado` uno de los 5.
- `deleteConcesionario`: sin cambios de código (el cascade de BD limpia las
  expansiones). Se actualiza el comentario del servicio.

## Frontend

### `ConcesionarioModal.tsx` (método maestro, paleta estricta)
- Select "Estado operativo" con 5 opciones (Activo, Inactivo, Próximo, En
  ejecución, Completado).
- Select "Tipo de expansión" (Apertura, Ampliación, Relocalización, Otro) y
  campo fecha "Apertura programada" (`type="date"`), visibles solo cuando el
  estado es `proximo`/`en_ejecucion`/`completado`. La fecha es requerida en esos
  casos.
- Panel del modal con `bg-black` (#000000) absoluto, bordes `mm-gray-700`,
  acentos `mm-yellow`, textos blancos y `color-scheme: dark` (ya global en
  `:root`, se refuerza con `style={{ colorScheme: 'dark' }}` en el contenedor).
- `aFormulario` y `manejarEnvio` incluyen los 3 campos nuevos en el payload.

### Badges / pins / filtros (5 estados)
- `DashboardConcesionarios.BadgeEstado` y filtro de estado con 5 opciones:
  - `activo` → `mm-success` (verde)
  - `inactivo` → `mm-error` (rojo)
  - `proximo` → `mm-yellow`
  - `en_ejecucion` → `mm-warning`
  - `completado` → `mm-success`
- `DetalleConcesionarioModal`: badge de estado con las 5 variantes + mostrar
  `tipo_expansion` y `fecha_apertura_programada` cuando existan.
- `MapaConcesionarios` (`iconoConcesionario` + CSS en `index.css`): nuevas clases
  `.mm-pin-proximo`, `.mm-pin-en_ejecucion`, `.mm-pin-completado` y badge de popup
  para los nuevos estados.
- `ConfirmarEliminacionModal`: texto actualizado mencionando que también se
  elimina la apertura programada del calendario.

### Tipos frontend
- `packages/frontend/src/types/concesionario.ts`: `EstadoOperativo` ampliado y
  campos nuevos en interfaces (`Concesionario`, `Create/UpdateConcesionarioInput`).

## Flujo de datos

1. `ConcesionarioModal` guarda → `POST/PUT /api/v1/concesionarios`.
2. Backend persiste el concesionario y `sincronizarExpansion` upsertea/soft-deletea
   la expansión en el mismo request.
3. `DashboardConcesionarios.recargar()` refresca lista/mapa; cronograma y dashboard
   gerencial recargan en cada montaje; el delete en cascada deja el calendario
   sin huérfanos.

## Manejo de errores

- La sincronización falla → el request de concesionario devuelve `ApiError` con
  `statusCode` y el toast del modal muestra el mensaje (sin estado parcial
  divergente gracias a que se ejecuta en el mismo handler).
- `apiService` mantiene su contrato `ApiResponse` existente.

## Verificación

- Backend: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json` y
  `npm.cmd run build --workspace=@mundo-motos/backend`.
- Frontend: `npm.cmd run build --workspace=@mundo-motos/frontend`
  (`tsc --noEmit && vite build && purge-blue`). No se arreglan errores
  preexistentes ajenos a este cambio.
- Aplicar migración `007` a Supabase `zpjoneyojbtutszvwyxg` vía `apply_migration`
  y revisar advisors de seguridad.
- Commit + push a `main`.

## Fuera de alcance

- Edición de expansiones desde el cronograma (solo creación manual y soft delete).
- Autenticación/RLS real (no cambia).
- Renombrar `estado` a `estado_operativo` (decisión: se extiende `estado`).
