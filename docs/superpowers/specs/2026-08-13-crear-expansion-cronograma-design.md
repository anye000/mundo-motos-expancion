# Diseño — Crear nuevas expansiones en el cronograma

**Fecha:** 2026-08-13
**Estado:** Aprobado por el usuario (luz verde para implementación y despliegue)

## Objetivo

Permitir registrar una nueva expansión desde la vista `CronogramaExpansions`
del CRM de Mundo Motos mediante un modal corporativo (`ExpansionModal`), que
hace `POST` contra el módulo `expansiones` (Supabase), actualiza la lista
local vía el hook `useExpansiones` y muestra una notificación de éxito.

## Decisiones de alcance (acordadas)

1. **Columna `tipo`**: nueva columna en la tabla `expansiones` (el modelo no
   la tenía). Se usa para el tipo de apertura (apertura, ampliación,
   relocalización, otro).
2. **Columnas `ciudad` + `departamento`**: nuevas columnas separadas.
3. **Enfoque A — `locacion` derivada**: se conserva la columna `locacion`; el
   backend la compone como `"Ciudad, Departamento"` al crear/actualizar. La UI
   existente (chips del calendario, dashboard, listado) sigue leyendo
   `locacion` sin cambios. Los registros antiguos se siguen mostrando.

## Cambios

### 1. Base de datos — `006_expansiones_estructura.sql`

```sql
ALTER TABLE expansiones
  ADD COLUMN tipo VARCHAR(80) NOT NULL DEFAULT 'apertura',
  ADD COLUMN ciudad VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN departamento VARCHAR(255) NOT NULL DEFAULT '';
```

- `tipo` default `'apertura'`; `ciudad`/`departamento` default `''` para que
  las filas existentes migren sin problema (NOT NULL).
- Se aplica manualmente en Supabase (SQL editor) como las migraciones previas.

### 2. Backend

- **`expansion.model.ts`**: añadir `tipo: string`, `ciudad: string`,
  `departamento: string` a `Expansion`; y `tipo?`, `ciudad?`, `departamento?`
  a `CreateExpansionInput` y `UpdateExpansionInput`.
- **`expansion.service.ts`**:
  - `createExpansion`: si llegan `ciudad`/`departamento`, validarlos como
    requeridos y derivar `locacion = "${ciudad}, ${departamento}"`. Si un
    cliente legacy envía solo `locacion`, se mantiene el comportamiento actual
    (ciudad/departamento quedan vacíos). `tipo` se valida como string no vacío
    con default `'apertura'`.
  - `updateExpansion`: al recibir `ciudad`/`departamento` re-derivar
    `locacion`; validar `tipo` igual que en create.

### 3. Frontend — datos

- **`types/expansion.ts`**: añadir `tipo`, `ciudad`, `departamento` a
  `Expansion` y a los inputs.
- **`useExpansiones.ts`**: nuevo método
  `crear(input: CreateExpansionInput): Promise<Expansion>` que llama a
  `apiService.createExpansion`, refresca la lista local (`cargar(filtros)`,
  mismo patrón que `eliminar`) y devuelve la expansión creada.

### 4. Frontend — `ExpansionModal.tsx` (nuevo componente)

- Props: `abierto: boolean`, `onCerrar: () => void`,
  `crear: (input: CreateExpansionInput) => Promise<Expansion>` (método del
  hook, propiedad de `CronogramaExpansions` para que la lista se actualice en
  la misma instancia), `onCreada: (expansion: Expansion) => void`.
- Campos (todos con `input-dark`, panel `bg-black`, acentos `mm-yellow`,
  textos blancos):
  - **Título/Nombre** → `concesionario` (input, requerido).
  - **Fecha programada** → `<input type="date">`, requerido, default
    `2026-01-01`, `min="2026-01-01"` `max="2026-12-31"`.
  - **Ciudad** → input, requerido.
  - **Departamento** → input, requerido.
  - **Estado operativo** → select: `proximo` / `en_ejecucion` / `completado`.
  - **Tipo** → select: `apertura` / `ampliacion` / `relocalizacion` / `otro`,
    default `apertura`.
  - **Descripción** → textarea opcional → `observaciones`.
  - `avance` derivado: `completado → 100`, resto → `0`.
  - Sin latitud/longitud (quedan `null`).
- Flujo: al enviar, `await crear(payload)` → `toast.success` → `onCreada` →
  cierre. Errores en panel inline (patrón `ConcesionarioModal`).
- Cero azul/cian; identidad estricta negro/amarillo/blanco.

### 5. Frontend — `CronogramaExpansions.tsx`

- Botón destacado **"+ Nueva Expansión"** (`bg-mm-yellow text-mm-black`,
  icono `Plus`) en la cabecera, junto a la navegación de mes.
- Estado `modalAbierto` y render de `<ExpansionModal />`.
- Al crear con éxito: cerrar modal, navegar el calendario al mes de la fecha
  creada y seleccionar ese día (`setMesVisible` + `setDiaSeleccionado`).

### 6. CSS — `styles/index.css`

- Añadir `color-scheme: dark` en `:root` para que el date picker nativo y los
  controles se rendericen en modo oscuro (consistencia de marca).

## Verificación

- `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`
- `npx.cmd tsc --noEmit -p packages/frontend/tsconfig.app.json`
- `npm.cmd run build --workspace=@mundo-motos/frontend`

## Despliegue

1. Aplicar la migración `006_expansiones_estructura.sql` al proyecto Supabase
   `zpjoneyojbtutszvwyxg`.
2. Commit + push a `main` de `anye000/mundo-motos-expancion`. Render
   (`autoDeploy: true`) despliega backend y frontend automáticamente.
