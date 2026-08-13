# Formulario de Concesionarios como método maestro y sincronización con Expansiones — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `ConcesionarioModal` en el método maestro del CRM: estados operativos de 5 valores, fecha de apertura programada y tipo de expansión, con sincronización automática hacia `expansiones` (cronograma) al crear/editar/eliminar, paleta corporativa estricta y despliegue a `main`.

**Architecture:** Migración SQL añade columnas a `concesionarios` y FK `concesionario_id` a `expansiones` (backfill por nombre). El backend extiende el modelo y añade `sincronizarExpansion()` en `expansion.service.ts`, invocada por `concesionario.service.ts` tras cada create/update (upsert o soft delete según estado). El frontend amplía el modal y los badges/pins/filtros para los 5 estados.

**Tech Stack:** TypeScript, Express, Supabase (`@supabase/supabase-js`), React 18, Tailwind CSS, react-leaflet, Vite.

## Global Constraints

- Español en todo: docs, comentarios, mensajes de error, campos de API.
- Paleta corporativa estricta: fondo negro absoluto `#000000` (`bg-black`/`mm-gray-900`), acentos/bordes `#FFCC00` (`mm-yellow`), textos blancos/grises neutros, `color-scheme: dark`. Cero azul/cian.
- `EstadoOperativo = 'activo' | 'inactivo' | 'proximo' | 'en_ejecucion' | 'completado'`.
- `TipoExpansion = 'apertura' | 'ampliacion' | 'relocalizacion' | 'otro'` (default `'apertura'`).
- Los estados de expansión sincronizados son `proximo`, `en_ejecucion`, `completado`; `activo`/`inactivo` eliminan (soft delete) la expansión vinculada.
- No se pisan `avance`/`observaciones` de la expansión al editar desde el concesionario.
- PowerShell: usar `npm.cmd`/`npx.cmd`, nunca `npm`/`npx`.
- No existe infraestructura de tests en el repo (sin archivos `.test.ts`); la verificación por tarea es `tsc --noEmit` y los builds. No introducir un framework de tests (fuera de alcance, según verificación solicitada por el usuario).
- Migración `007` se aplica a Supabase `zpjoneyojbtutszvwyxg` vía MCP **después** de pasar tsc/build.
- Al final: commit + push a `main`.

---

### Task 1: Migración `007_concesionarios_estado_expansion.sql`

**Files:**
- Create: `packages/backend/src/database/migrations/007_concesionarios_estado_expansion.sql`

**Interfaces:**
- Produces: SQL aplicable a Supabase que amplía `concesionarios.estado`, añade `fecha_apertura_programada`/`tipo_expansion` y añade `expansiones.concesionario_id` con FK cascade + backfill por nombre.

- [ ] **Step 1: Crear el archivo SQL**

Crear `packages/backend/src/database/migrations/007_concesionarios_estado_expansion.sql` con:

```sql
-- Migración 007: concesionario como método maestro y sincronización con expansiones
--
-- 1) Amplía el estado operativo de `concesionarios` a 5 valores (activo,
--    inactivo, proximo, en_ejecucion, completado).
-- 2) Añade `fecha_apertura_programada` (DATE NULL) y `tipo_expansion`
--    (apertura/ampliacion/relocalizacion/otro, default 'apertura').
-- 3) Vincula `expansiones` con `concesionarios` vía `concesionario_id`
--    (ON DELETE CASCADE) y rellena (backfill) las filas existentes por
--    coincidencia de nombre, para que el DELETE en cascada limpie el
--    calendario.

-- 1) Estado operativo ampliado
ALTER TABLE concesionarios DROP CONSTRAINT concesionarios_estado_check;
ALTER TABLE concesionarios ADD CONSTRAINT concesionarios_estado_check
  CHECK (estado IN ('activo', 'inactivo', 'proximo', 'en_ejecucion', 'completado'));

-- 2) Nuevas columnas de concesionario
ALTER TABLE concesionarios
  ADD COLUMN fecha_apertura_programada DATE,
  ADD COLUMN tipo_expansion VARCHAR(80) NOT NULL DEFAULT 'apertura'
    CHECK (tipo_expansion IN ('apertura', 'ampliacion', 'relocalizacion', 'otro'));

-- 3) FK concesionario_id en expansiones + índice + backfill
ALTER TABLE expansiones
  ADD COLUMN concesionario_id UUID REFERENCES concesionarios(id) ON DELETE CASCADE;

CREATE INDEX idx_expansiones_concesionario_id ON expansiones(concesionario_id);

UPDATE expansiones e
  SET concesionario_id = c.id
  FROM concesionarios c
  WHERE c.nombre = e.concesionario AND c.deleted_at IS NULL AND e.concesionario_id IS NULL;
```

- [ ] **Step 2: Validar sintaxis (sin conexión)**

No hay runner de migraciones en el repo (se aplica manualmente vía Supabase). La validación real ocurre en la Task 7 con `apply_migration`. Verificar lectura del archivo:

Run: `Get-Content packages/backend/src/database/migrations/007_concesionarios_estado_expansion.sql`
Expected: contenido completo y consistente (check ampliado, columnas nuevas, FK, backfill).

- [ ] **Step 3: Commit**

```bash
git add packages/backend/src/database/migrations/007_concesionarios_estado_expansion.sql
git commit -m "feat(db): migracion 007 estado operativo ampliado, tipo/fecha de expansion y FK concesionario_id en expansiones"
```

---

### Task 2: Tipos de Concesionario (backend + frontend)

**Files:**
- Modify: `packages/backend/src/modules/concesionarios/concesionario.model.ts`
- Modify: `packages/frontend/src/types/concesionario.ts`
- Modify: `packages/backend/src/modules/expansiones/expansion.model.ts` (solo `concesionario_id` en inputs/interface)
- Modify: `packages/frontend/src/types/expansion.ts`

**Interfaces:**
- Consumes: nada de tareas previas.
- Produces:
  - `EstadoOperativo` de 5 valores (backend y frontend).
  - `Concesionario` con `fecha_apertura_programada: string | null` y `tipo_expansion: string`.
  - `CreateConcesionarioInput`/`UpdateConcesionarioInput` con `fecha_apertura_programada?: string | null` y `tipo_expansion?: TipoExpansion`.
  - `Expansion` con `concesionario_id: string | null`; `CreateExpansionInput`/`UpdateExpansionInput` con `concesionario_id?: string | null`.

- [ ] **Step 1: Backend `concesionario.model.ts`**

Reemplazar la línea del tipo y los interfaces:

```ts
export type EstadoOperativo =
  | 'activo'
  | 'inactivo'
  | 'proximo'
  | 'en_ejecucion'
  | 'completado';

export type TipoExpansion = 'apertura' | 'ampliacion' | 'relocalizacion' | 'otro';
```

En `Concesionario`, tras `estado: EstadoOperativo;` añadir:

```ts
  fecha_apertura_programada: string | null;
  tipo_expansion: string;
```

En `CreateConcesionarioInput`, tras `estado?: EstadoOperativo;` añadir:

```ts
  fecha_apertura_programada?: string | null;
  tipo_expansion?: TipoExpansion;
```

En `UpdateConcesionarioInput`, tras `estado?: EstadoOperativo;` añadir:

```ts
  fecha_apertura_programada?: string | null;
  tipo_expansion?: TipoExpansion;
```

- [ ] **Step 2: Frontend `types/concesionario.ts`**

Aplicar exactamente el mismo cambio: `EstadoOperativo` de 5 valores, `TipoExpansion`, campos en `Concesionario` y en `Create/UpdateConcesionarioInput`.

- [ ] **Step 3: Backend `expansion.model.ts`**

En `Expansion`, tras `concesionario: string;` añadir:

```ts
  concesionario_id: string | null;
```

En `CreateExpansionInput` y `UpdateExpansionInput`, tras `concesionario: string;` (y `concesionario?: string;` respectivamente) añadir:

```ts
  concesionario_id?: string | null;
```

- [ ] **Step 4: Frontend `types/expansion.ts`**

Mismo cambio aditivo en `Expansion` (`concesionario_id: string | null`) y en `CreateExpansionInput`/`UpdateExpansionInput` (`concesionario_id?: string | null`).

- [ ] **Step 5: Verificación de tipos**

Run: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`
Expected: PASS (sin errores).

Run: `npx.cmd tsc --noEmit -p packages/frontend/tsconfig.app.json`
Expected: PASS (sin errores).

- [ ] **Step 6: Commit**

```bash
git add packages/backend/src/modules/concesionarios/concesionario.model.ts packages/backend/src/modules/expansiones/expansion.model.ts packages/frontend/src/types/concesionario.ts packages/frontend/src/types/expansion.ts
git commit -m "feat(types): estado operativo de 5 valores, tipo/fecha de expansion en concesionario y concesionario_id en expansiones"
```

---

### Task 3: Sincronización en `expansion.service.ts`

**Files:**
- Modify: `packages/backend/src/modules/expansiones/expansion.service.ts`

**Interfaces:**
- Consumes: `Concesionario` de `../concesionarios/concesionario.model` (import type), `EstadoOperativo`.
- Produces:
  - `getExpansionByConcesionarioId(concesionarioId: string): Promise<Expansion | null>` (incluye soft-deleted).
  - `sincronizarExpansion(concesionario: Concesionario): Promise<void>`.
  - `createExpansion` acepta `concesionario_id`; `updateExpansion` acepta `concesionario_id`.

- [ ] **Step 1: Añadir `concesionario_id` a insert/update de expansión**

En `createExpansion`, en el objeto `insert`, tras `concesionario,` añadir:

```ts
      concesionario_id: input.concesionario_id ?? null,
```

En `updateExpansion`, dentro del bloque de `updates`, añadir:

```ts
  if (input.concesionario_id !== undefined) {
    updates.concesionario_id = input.concesionario_id;
  }
```

- [ ] **Step 2: Añadir import de tipos de Concesionario**

Al inicio del archivo (bloque de imports de modelos), tras los imports existentes de `./expansion.model`:

```ts
import type { Concesionario, EstadoOperativo } from '../concesionarios/concesionario.model';
```

(Import type puro: `concesionario.service.ts` importa `sincronizarExpansion` en runtime, y este archivo solo necesita los tipos de `concesionario.model`, evitando ciclos runtime.)

- [ ] **Step 3: Añadir constantes y helpers de sincronización**

Después de `const AVANCE_MAX = 100;` añadir:

```ts
/** Estados del concesionario que se reflejan en el cronograma de expansiones. */
const ESTADOS_EXPANSION: EstadoOperativo[] = ['proximo', 'en_ejecucion', 'completado'];
```

Después de la función `validateCoordenada` añadir las funciones `restaurarExpansion`, `softDeleteExpansionById` y `getExpansionByConcesionarioId`:

```ts
/** Restaura una expansión soft-deleted (reactivación desde el concesionario). */
async function restaurarExpansion(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    throw mapSupabaseError(error, 'Error al restaurar la expansión');
  }
}

/** Soft delete directo por id (usado por la sincronización del concesionario). */
async function softDeleteExpansionById(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    throw mapSupabaseError(error, 'Error al eliminar la expansión');
  }
}

/**
 * Obtiene la expansión vinculada a un concesionario. Incluye las soft-deleted
 * para poder restaurarlas sin duplicar filas al reactivar el estado.
 */
export async function getExpansionByConcesionarioId(
  concesionarioId: string
): Promise<Expansion | null> {
  if (!concesionarioId) {
    return null;
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('concesionario_id', concesionarioId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
    .returns<Expansion | null>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener la expansión del concesionario');
  }
  return data as Expansion | null;
}
```

- [ ] **Step 4: Añadir la función `sincronizarExpansion`**

Al final del archivo (después de `deleteExpansion`) añadir:

```ts
/**
 * Sincroniza la expansión vinculada a un concesionario (formulario maestro).
 *
 * - Estados de expansión (`proximo`, `en_ejecucion`, `completado`) con fecha
 *   de apertura programada: upsertea la expansión vinculada, restaurando una
 *   soft-deleted si existía. Nunca pisa `avance`/`observaciones` (los gestiona
 *   el cronograma).
 * - Estados operativos (`activo`, `inactivo`) o sin fecha: soft deletea la
 *   expansión vinculada si existía.
 */
export async function sincronizarExpansion(concesionario: Concesionario): Promise<void> {
  const esEstadoExpansion = (ESTADOS_EXPANSION as string[]).includes(concesionario.estado);
  const fechaProgramada = concesionario.fecha_apertura_programada;
  const tieneFecha =
    typeof fechaProgramada === 'string' &&
    fechaProgramada.trim() !== '' &&
    !Number.isNaN(Date.parse(fechaProgramada));

  const existente = await getExpansionByConcesionarioId(concesionario.id);

  if (!esEstadoExpansion || !tieneFecha) {
    if (existente && existente.deleted_at === null) {
      await softDeleteExpansionById(existente.id);
    }
    return;
  }

  if (existente) {
    if (existente.deleted_at !== null) {
      await restaurarExpansion(existente.id);
    }
    await updateExpansion(existente.id, {
      concesionario: concesionario.nombre,
      fecha_apertura: fechaProgramada,
      estado: concesionario.estado as EstadoExpansion,
      tipo: concesionario.tipo_expansion,
      ciudad: concesionario.ciudad,
      departamento: concesionario.departamento,
      latitud: concesionario.latitud,
      longitud: concesionario.longitud,
    });
    return;
  }

  await createExpansion({
    concesionario: concesionario.nombre,
    concesionario_id: concesionario.id,
    fecha_apertura: fechaProgramada,
    estado: concesionario.estado as EstadoExpansion,
    tipo: concesionario.tipo_expansion,
    ciudad: concesionario.ciudad,
    departamento: concesionario.departamento,
    latitud: concesionario.latitud,
    longitud: concesionario.longitud,
    avance: concesionario.estado === 'completado' ? 100 : 0,
  });
}
```

Nota: `EstadoExpansion` ya está importado en el archivo; `ESTADOS_VALIDOS` se conserva. El cast `concesionario.estado as EstadoExpansion` es válido porque `EstadoExpansion` es subtipo de `EstadoOperativo`.

- [ ] **Step 5: Verificación de tipos**

Run: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/backend/src/modules/expansiones/expansion.service.ts
git commit -m "feat(backend): sincronizacion de expansiones desde el concesionario (upsert/soft-delete por concesionario_id)"
```

---

### Task 4: Integración en `concesionario.service.ts` + controller

**Files:**
- Modify: `packages/backend/src/modules/concesionarios/concesionario.service.ts`
- Modify: `packages/backend/src/modules/concesionarios/concesionario.controller.ts` (solo lista de `ESTADOS_VALIDOS`)

**Interfaces:**
- Consumes: `sincronizarExpansion` de `../expansiones/expansion.service`.
- Produces: create/update de concesionario que persisten y sincronizan la expansión en el mismo request; validación de `fecha_apertura_programada` y `tipo_expansion`.

- [ ] **Step 1: Actualizar constantes y validadores**

En `concesionario.service.ts`, reemplazar:

```ts
const ESTADOS_VALIDOS: EstadoOperativo[] = ['activo', 'inactivo'];
```

por:

```ts
const ESTADOS_VALIDOS: EstadoOperativo[] = [
  'activo',
  'inactivo',
  'proximo',
  'en_ejecucion',
  'completado',
];
const TIPOS_EXPANSION_VALIDOS = ['apertura', 'ampliacion', 'relocalizacion', 'otro'] as const;
type TipoExpansion = (typeof TIPOS_EXPANSION_VALIDOS)[number];
```

Y añadir después de `isEstadoOperativo`:

```ts
function isTipoExpansion(value: unknown): value is TipoExpansion {
  return typeof value === 'string' && (TIPOS_EXPANSION_VALIDOS as readonly string[]).includes(value);
}

function validateFechaOpcional(value: unknown, campo: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new ApiError(`El campo "${campo}" debe ser una fecha válida (YYYY-MM-DD)`, 400);
  }
  return value.trim();
}
```

- [ ] **Step 2: Importar `sincronizarExpansion`**

Tras el import de `./concesionario.model` añadir:

```ts
import { sincronizarExpansion } from '../expansiones/expansion.service';
```

- [ ] **Step 3: `createConcesionario` — campos nuevos + sync**

Después de la línea que calcula `const estado: EstadoOperativo = ...` añadir:

```ts
  const fechaAperturaProgramada = validateFechaOpcional(
    input.fecha_apertura_programada,
    'fecha_apertura_programada'
  );
  const tipoExpansion: TipoExpansion =
    input.tipo_expansion && isTipoExpansion(input.tipo_expansion)
      ? input.tipo_expansion
      : 'apertura';
```

En el objeto `insert`, tras `estado,` añadir:

```ts
      fecha_apertura_programada: fechaAperturaProgramada,
      tipo_expansion: tipoExpansion,
```

Reemplazar el bloque final:

```ts
  if (error) {
    throw mapSupabaseError(error, 'Error al crear el concesionario');
  }

  return data as Concesionario;
```

por:

```ts
  if (error) {
    throw mapSupabaseError(error, 'Error al crear el concesionario');
  }

  const creado = data as Concesionario;
  await sincronizarExpansion(creado);
  return creado;
```

- [ ] **Step 4: `updateConcesionario` — campos nuevos + sync**

Dentro de `updateConcesionario`, después del bloque `if (input.estado !== undefined) { ... }` añadir:

```ts
  if (input.fecha_apertura_programada !== undefined) {
    updates.fecha_apertura_programada = validateFechaOpcional(
      input.fecha_apertura_programada,
      'fecha_apertura_programada'
    );
  }
  if (input.tipo_expansion !== undefined) {
    if (!isTipoExpansion(input.tipo_expansion)) {
      throw new ApiError(
        `Tipo de expansión inválido. Valores válidos: ${TIPOS_EXPANSION_VALIDOS.join(', ')}`,
        400
      );
    }
    updates.tipo_expansion = input.tipo_expansion;
  }
```

Reemplazar el bloque final:

```ts
  if (error) {
    throw mapSupabaseError(error, 'Error al actualizar el concesionario');
  }
  if (!data) {
    throw new ApiError('Concesionario no encontrado', 404);
  }

  return data as Concesionario;
```

por:

```ts
  if (error) {
    throw mapSupabaseError(error, 'Error al actualizar el concesionario');
  }
  if (!data) {
    throw new ApiError('Concesionario no encontrado', 404);
  }

  const actualizado = data as Concesionario;
  await sincronizarExpansion(actualizado);
  return actualizado;
```

- [ ] **Step 5: Actualizar `deleteConcesionario` (comentario)**

Reemplazar el comentario del servicio `deleteConcesionario` por:

```ts
/**
 * Elimina físicamente un concesionario. El historial de interacciones CRM y las
 * expansiones vinculadas (cronograma/calendario) se eliminan en cascada
 * (ON DELETE CASCADE en interacciones_crm y expansiones.concesionario_id).
 */
```

- [ ] **Step 6: Controller — filtro por los 5 estados**

En `concesionario.controller.ts`, reemplazar:

```ts
const ESTADOS_VALIDOS: EstadoOperativo[] = ['activo', 'inactivo'];
```

por:

```ts
const ESTADOS_VALIDOS: EstadoOperativo[] = [
  'activo',
  'inactivo',
  'proximo',
  'en_ejecucion',
  'completado',
];
```

- [ ] **Step 7: Verificación de tipos y build**

Run: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`
Expected: PASS.

Run: `npm.cmd run build --workspace=@mundo-motos/backend`
Expected: PASS (genera `dist/`).

- [ ] **Step 8: Commit**

```bash
git add packages/backend/src/modules/concesionarios/concesionario.service.ts packages/backend/src/modules/concesionarios/concesionario.controller.ts
git commit -m "feat(backend): concesionario sincroniza expansion al crear/editar y valida estado/tipo/fecha"
```

---

### Task 5: Modal de concesionarios (método maestro, paleta estricta)

**Files:**
- Modify: `packages/frontend/src/components/ConcesionarioModal.tsx`

**Interfaces:**
- Consumes: `EstadoOperativo` y `Concesionario` ampliados de `../types/concesionario`.
- Produces: payload de create/update con `estado` (5 valores), `fecha_apertura_programada` y `tipo_expansion`; panel `bg-black` con `color-scheme: dark`.

- [ ] **Step 1: Ampliar `FormConcesionario` y `FORM_INICIAL`**

En `interface FormConcesionario`, tras `estado: EstadoOperativo` añadir:

```ts
  fecha_apertura_programada: string
  tipo_expansion: string
```

En `FORM_INICIAL`, tras `estado: 'activo',` añadir:

```ts
  fecha_apertura_programada: '',
  tipo_expansion: 'apertura',
```

- [ ] **Step 2: Ampliar `aFormulario`**

Tras `estado: concesionario.estado,` añadir:

```ts
    fecha_apertura_programada: concesionario.fecha_apertura_programada ?? '',
    tipo_expansion: concesionario.tipo_expansion,
```

- [ ] **Step 3: Validación en `manejarEnvio`**

Tras el bloque que valida coordenadas añadir:

```ts
    const esEstadoExpansion = ['proximo', 'en_ejecucion', 'completado'].includes(form.estado)
    if (esEstadoExpansion && !form.fecha_apertura_programada) {
      setError('La fecha de apertura programada es obligatoria para estados de expansión')
      return
    }
```

En el `payload`, tras `estado: form.estado,` añadir:

```ts
        fecha_apertura_programada: esEstadoExpansion ? form.fecha_apertura_programada : null,
        tipo_expansion: form.tipo_expansion as TipoExpansion,
```

(`TipoExpansion` ya se importa desde `../types/concesionario` junto a `EstadoOperativo`; el cast es seguro porque el `<select>` solo ofrece los 4 valores válidos.)

- [ ] **Step 4: Select de estado con 5 opciones + campos condicionales**

Reemplazar el bloque `label` de "Estado operativo" (que contiene el `<select>` con 2 opciones) por:

```tsx
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Estado operativo</span>
              <select
                className="input-dark"
                value={form.estado}
                onChange={(e) => actualizar('estado', e.target.value)}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="proximo">Próximo</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="completado">Completado</option>
              </select>
            </label>
```

Inmediatamente después de ese `label`, añadir el bloque condicional (visible solo con estado de expansión):

```tsx
            {['proximo', 'en_ejecucion', 'completado'].includes(form.estado) && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-mm-gray-300">
                    Tipo de expansión
                  </span>
                  <select
                    className="input-dark"
                    value={form.tipo_expansion}
                    onChange={(e) => actualizar('tipo_expansion', e.target.value)}
                  >
                    <option value="apertura">Apertura</option>
                    <option value="ampliacion">Ampliación</option>
                    <option value="relocalizacion">Relocalización</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-mm-gray-300">
                    Apertura programada *
                  </span>
                  <input
                    type="date"
                    className="input-dark"
                    value={form.fecha_apertura_programada}
                    onChange={(e) => actualizar('fecha_apertura_programada', e.target.value)}
                  />
                </label>
              </>
            )}
```

- [ ] **Step 5: Fondo negro absoluto + `color-scheme: dark`**

En el panel del modal, reemplazar:

```tsx
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-mm-gray-800 border border-mm-gray-600 shadow-xl animate-fadeInDown"
        onClick={(e) => e.stopPropagation()}
```

por:

```tsx
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-black border border-mm-gray-700 shadow-xl animate-fadeInDown"
        style={{ colorScheme: 'dark' }}
        onClick={(e) => e.stopPropagation()}
```

- [ ] **Step 6: Verificación de tipos**

Run: `npx.cmd tsc --noEmit -p packages/frontend/tsconfig.app.json`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/frontend/src/components/ConcesionarioModal.tsx
git commit -m "feat(frontend): modal maestro con 5 estados, tipo de expansion, fecha programada y paleta negra estricta"
```

---

### Task 6: Badges, filtros, pins y modales para los 5 estados

**Files:**
- Modify: `packages/frontend/src/components/DashboardConcesionarios.tsx`
- Modify: `packages/frontend/src/components/DetalleConcesionarioModal.tsx`
- Modify: `packages/frontend/src/components/MapaConcesionarios.tsx`
- Modify: `packages/frontend/src/components/ConfirmarEliminacionModal.tsx`
- Modify: `packages/frontend/src/styles/index.css`

**Interfaces:**
- Consumes: `EstadoOperativo` ampliado.
- Produces: visualización y filtrado de los 5 estados en listado, mapa, detalle y confirmación de borrado.

- [ ] **Step 1: `DashboardConcesionarios.tsx` — BadgeEstado y filtro**

Reemplazar la función `BadgeEstado` completa por:

```tsx
const ESTADO_LABEL: Record<EstadoOperativo, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  proximo: 'Próximo',
  en_ejecucion: 'En ejecución',
  completado: 'Completado',
}

const ESTADO_BADGE: Record<EstadoOperativo, string> = {
  activo: 'bg-mm-success/15 text-mm-success border-mm-success/30',
  inactivo: 'bg-mm-error/15 text-mm-error border-mm-error/30',
  proximo: 'bg-mm-yellow/15 text-mm-yellow border-mm-yellow/30',
  en_ejecucion: 'bg-mm-warning/15 text-mm-warning border-mm-warning/30',
  completado: 'bg-mm-success/15 text-mm-success border-mm-success/30',
}

function BadgeEstado({ estado }: { estado: EstadoOperativo }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_BADGE[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  )
}
```

En el filtro de "Estado operativo", reemplazar las dos `<option>` por las 5:

```tsx
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="proximo">Próximo</option>
                  <option value="en_ejecucion">En ejecución</option>
                  <option value="completado">Completado</option>
```

- [ ] **Step 2: `DetalleConcesionarioModal.tsx` — badge y datos de expansión**

Reemplazar la línea `const activo = concesionario.estado === 'activo'` y el bloque del badge de "Estado operativo" (el `<span>` con ternario `activo ? ... : ...`) por:

```tsx
  const esEstadoExpansion = ['proximo', 'en_ejecucion', 'completado'].includes(
    concesionario.estado
  )
```

```tsx
            <div>
              <p className="text-xs font-medium text-mm-gray-400">Estado operativo</p>
              <span
                className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  concesionario.estado === 'activo'
                    ? 'bg-mm-success/15 text-mm-success border-mm-success/30'
                    : concesionario.estado === 'inactivo'
                      ? 'bg-mm-error/15 text-mm-error border-mm-error/30'
                      : concesionario.estado === 'proximo'
                        ? 'bg-mm-yellow/15 text-mm-yellow border-mm-yellow/30'
                        : concesionario.estado === 'en_ejecucion'
                          ? 'bg-mm-warning/15 text-mm-warning border-mm-warning/30'
                          : 'bg-mm-success/15 text-mm-success border-mm-success/30'
                }`}
              >
                {concesionario.estado === 'activo'
                  ? 'Activo'
                  : concesionario.estado === 'inactivo'
                    ? 'Inactivo'
                    : concesionario.estado === 'proximo'
                      ? 'Próximo'
                      : concesionario.estado === 'en_ejecucion'
                        ? 'En ejecución'
                        : 'Completado'}
              </span>
            </div>
```

Tras el bloque que muestra Email, añadir (dentro de la misma grid):

```tsx
            {esEstadoExpansion && (
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Tipo de expansión</p>
                <p className="mt-1 text-sm capitalize text-mm-gray-200">
                  {concesionario.tipo_expansion.replace('_', ' ')}
                </p>
              </div>
            )}
            {concesionario.fecha_apertura_programada && (
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Apertura programada</p>
                <p className="mt-1 text-sm text-mm-gray-200">
                  {concesionario.fecha_apertura_programada}
                </p>
              </div>
            )}
```

- [ ] **Step 3: `MapaConcesionarios.tsx` — icono y popup**

Reemplazar `iconoConcesionario` por:

```tsx
/** Crea el icono personalizado (pin) con la identidad de Mundo Motos. */
export function iconoConcesionario(estado: EstadoOperativo): L.DivIcon {
  return L.divIcon({
    className: 'mm-pin-wrapper',
    html: `<div class="mm-pin mm-pin-${estado}"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}
```

Reemplazar el `<span>` de badge del popup y su texto por:

```tsx
                    <span className={`badge-estado ${concesionario.estado}`}>
                      {concesionario.estado === 'activo'
                        ? 'Activo'
                        : concesionario.estado === 'inactivo'
                          ? 'Inactivo'
                          : concesionario.estado === 'proximo'
                            ? 'Próximo'
                            : concesionario.estado === 'en_ejecucion'
                              ? 'En ejecución'
                              : 'Completado'}
                    </span>
```

- [ ] **Step 4: `ConfirmarEliminacionModal.tsx` — texto**

Reemplazar el párrafo de advertencia por:

```tsx
          <p className="rounded-lg bg-mm-error/10 border border-mm-error/40 px-3 py-2 text-xs text-mm-error">
            Esta acción eliminará también el historial de interacciones CRM del concesionario y
            su apertura programada del calendario de expansiones. No se puede deshacer.
          </p>
```

- [ ] **Step 5: `index.css` — pins y badges nuevos**

Reemplazar `.mm-pin-activo`/`.mm-pin-inactivo` por:

```css
.mm-pin-activo {
  background: #ffcc00;
}

.mm-pin-inactivo {
  background: #a3a3a3;
}

.mm-pin-proximo {
  background: #ffcc00;
}

.mm-pin-en_ejecucion {
  background: #f59e0b;
}

.mm-pin-completado {
  background: #10b981;
}
```

Tras `.badge-estado.inactivo { ... }` añadir:

```css
.badge-estado.proximo {
  background: rgba(255, 204, 0, 0.15);
  color: #ffcc00;
  border: 1px solid rgba(255, 204, 0, 0.3);
}

.badge-estado.en_ejecucion {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-estado.completado {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
```

- [ ] **Step 6: Verificación de tipos**

Run: `npx.cmd tsc --noEmit -p packages/frontend/tsconfig.app.json`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/frontend/src/components/DashboardConcesionarios.tsx packages/frontend/src/components/DetalleConcesionarioModal.tsx packages/frontend/src/components/MapaConcesionarios.tsx packages/frontend/src/components/ConfirmarEliminacionModal.tsx packages/frontend/src/styles/index.css
git commit -m "feat(frontend): badges, filtros y pins para los 5 estados operativos"
```

---

### Task 7: Verificación completa, migración en producción y despliegue

**Files:**
- Ninguno nuevo.

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: Build backend**

Run: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`
Expected: PASS.

Run: `npm.cmd run build --workspace=@mundo-motos/backend`
Expected: PASS (genera `dist/`).

- [ ] **Step 2: Build frontend**

Run: `npm.cmd run build --workspace=@mundo-motos/frontend`
Expected: PASS (`tsc --noEmit` + `vite build` + `purge-blue.mjs`). Si hay errores preexistentes ajenos a este cambio, documentarlos sin arreglarlos.

- [ ] **Step 3: Aplicar migración a producción**

Usar la herramienta `supabase_apply_migration` con:
- `project_id`: `zpjoneyojbtutszvwyxg`
- `name`: `007_concesionarios_estado_expansion`
- `query`: el contenido exacto de `packages/backend/src/database/migrations/007_concesionarios_estado_expansion.sql`

Expected: éxito (migración aplicada, columnas y FK creadas, backfill hecho).

- [ ] **Step 4: Revisar advisors de seguridad**

Run: `supabase_get_advisors` (tipo `security`) sobre `zpjoneyojbtutszvwyxg`.
Expected: sin nuevos hallazgos graves introducidos por la migración.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat: formulario maestro de concesionarios con sincronizacion automatica de expansiones"
```

(El plan no fuerza el commit final si no hay cambios pendientes; verificarlo con `git status`.)

- [ ] **Step 6: Push a `main`**

```bash
git push origin main
```

Expected: `origin/main` actualizado.

---

## Self-Review

**Cobertura del spec:** Task 1 (esquema/backfill) ✓ · Task 2 (modelo ampliado backend+frontend) ✓ · Task 3 (sync en expansion.service, sin pisar avance/observaciones, restaura soft-deleted) ✓ · Task 4 (create/update sincronizan, validaciones, controller 5 estados) ✓ · Task 5 (modal maestro, paleta estricta, color-scheme dark) ✓ · Task 6 (badges/filtros/pins/detalle/confirmación) ✓ · Task 7 (tsc/build, migración prod vía MCP, advisors, commit+push a main) ✓.

**Placeholders:** Sin TBD/TODO; todo paso incluye código o comando exacto.

**Consistencia de tipos:** `sincronizarExpansion(concesionario: Concesionario)` coincide en Task 3 y Task 4; `getExpansionByConcesionarioId` se exporta y se usa internamente; `concesionario_id` en inputs de expansión se define en Task 2 y se consume en Task 3; `EstadoOperativo`/`TipoExpansion` de 5/4 valores consistentes en backend y frontend.
