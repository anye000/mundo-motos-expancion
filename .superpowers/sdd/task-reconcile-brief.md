# Tarea de Reconciliación: Frontend de Concesionarios

## Contexto

El working tree del repo ya contiene una **implementación completa y funcional** de la capa de UI de concesionarios (sin commitear). Es el entregable a conservar. Esta tarea: (1) verifica que compila y buildea de forma limpia, (2) arregla las divergencias con el spec de diseño aprobado, (3) commitea el trabajo en commits limpios.

Task 1 (tipos) ya está commiteada en `f83d5ea`. Los archivos que quedan por commitear son TODO el resto del frontend de concesionarios.

## Alcance

- **SOLO `packages/frontend`**. NO toques ni commitees nada de `packages/backend`, ni `package.json`/`package-lock.json` de la raíz, ni `AGENTS.md`, ni `.claude/`, ni `.superpowers/`.
- NO agregues dependencias nuevas.
- NO crees el facade `concesionariosApi`: la implementación existente usa métodos directos en `apiService`; se conserva tal cual.
- El dashboard usa **listado + modal** (no tabla): se conserva tal cual (decisión del usuario).
- El proxy de Vite (`rewrite` que quita `/api`) está roto y documentado: **no lo toques**; en dev se usa CORS directo a `http://localhost:3000`.

## Estado actual (verificado)

- `src/vite-env.d.ts` existe (referencia `vite/client`). ✔
- `src/services/api.ts`: `ApiService` con baseURL `import.meta.env.VITE_API_BASE_URL || '/api'` y métodos `getConcesionarios`, `getConcesionarioById`, `createConcesionario`, `updateConcesionario` (lanzan Error si `success:false`). Exporta `apiService`.
- `src/hooks/useConcesionarios.ts`: hook con filtros (ciudad/departamento/estado), carga con `limit:100`, deriva `ciudades`/`departamentos`.
- `src/components/MapaConcesionarios.tsx`: pins `divIcon` (`.mm-pin-activo`/`.mm-pin-inactivo`), popups con badge de estado + nombre + ciudad·departamento + dirección + teléfono + email, `AjustarVista` con fitBounds/flyTo, modo `modoSeleccionUbicacion` con `Coordenadas`. Exporta `iconoConcesionario`.
- `src/components/ConcesionarioModal.tsx`: formulario de alta con mini-mapa para fijar lat/lng, `react-hot-toast`.
- `src/components/DashboardConcesionarios.tsx`: tarjetas de estadísticas (total/activos/inactivos), panel de filtros, mapa + listado, botón "Nuevo".
- `src/App.tsx`: header/footer corporativos, ruta `/` → `<DashboardConcesionarios />`, `<Toaster />`.
- `src/main.tsx`: importa `leaflet/dist/leaflet.css` y registra el service worker.
- `vite.config.ts`: `manualChunks` ya en forma función (react/leaflet/vendor).
- `src/styles/index.css`: ya tiene `.input-dark`, `.mm-pin*`, `.leaflet-container`.
- `packages/frontend/.env.example`: **NO existe**.

## Tareas

### 1. Verificar compilación y build

Desde `packages/frontend`:
- `npx.cmd tsc --noEmit -p tsconfig.app.json` → debe dar EXIT=0.
- `npx.cmd vite build` → debe completar el build. Los warnings de assets PWA faltantes (favicon/pwa-*.png) son aceptables y preexistentes; NO los arregles (no están en tu alcance). Si el build FALLA por algo que no sean assets PWA, arréglalo (y repórtalo).

### 2. Reconciliar con el spec de diseño aprobado

a) **Popup del mapa — mostrar "Código" (NIT).** El spec pide que el popup muestre el campo `nit` bajo la etiqueta "Código". En `MapaConcesionarios.tsx` añade una línea en el popup (estilo `popup-concesionario-texto`) que muestre `Código: {concesionario.nit}` (usa la etiqueta exacta "Código").

b) **baseURL fallback.** Cambia en `src/services/api.ts` el fallback de `'/api'` a `'http://localhost:3000/api/v1'` (mismo estilo sin punto y coma del archivo):
   `constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1')`
   Mantiene el override por `VITE_API_BASE_URL` (tipo producción) y hace que dev funcione por CORS sin env.

c) **`.env.example` del frontend.** Crea `packages/frontend/.env.example` con contenido en español:
   ```
   # URL base de la API (backend). En desarrollo apunta al backend local.
   # En producción, apunta a la URL desplegada (ej. https://tu-api.render.com/api/v1).
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

d) **Estilos de popup corporativos.** Verifica que `src/styles/index.css` tenga los estilos usados por el popup de `MapaConcesionarios`: `.leaflet-popup-content-wrapper`, `.leaflet-popup-tip`, `.popup-concesionario-badges`, `.badge-estado`, `.popup-concesionario-titulo`, `.popup-concesionario-texto`. La paleta debe ser corporativa: fondo oscuro (mm-gray-900/800), título y acentos en mm-yellow. Si algún selector falta, añádelo (estilo del archivo existente, sin punto y coma no es obligatorio aquí — sigue el estilo del CSS existente).

### 3. Commit

Dos commits, staged SOLO archivos de `packages/frontend`:

1. `git add packages/frontend` (excluyendo `.env.example` todavía) y los archivos frontend modificados → commit:
   `feat(frontend): dashboard de concesionarios con mapa, filtros y alta`
   (Esto incluye: components/, hooks/, vite-env.d.ts, api.ts, App.tsx, main.tsx, index.css, vite.config.ts.)
   NO incluyas `.env.example` en este commit.

2. `git add packages/frontend/.env.example` y los archivos con los ajustes de reconciliación (api.ts baseURL, MapaConcesionarios popup, index.css) → commit:
   `fix(frontend): ajustes de reconciliación con el spec de diseño`

   Nota: si los ajustes de reconciliación tocan archivos ya staged en el commit 1, es normal: tras el commit 1, los archivos modificados quedan como cambios nuevos en el working tree; haz `git add` de los específicos para el commit 2. Usa `git status` para verificar exactamente qué entra en cada commit.

## Verificación final

- `npx.cmd tsc --noEmit -p tsconfig.app.json` → EXIT=0
- `npx.cmd vite build` → build OK (warnings PWA tolerados)
- `git status` → sin archivos de backend ni raíz staged; solo queda lo que deba quedar

## Reglas

- PowerShell: `npm.cmd`/`npx.cmd`, nunca `npm`/`npx`. Ejecutar comandos de build desde `packages/frontend` (usa el workdir).
- Español en textos de UI y mensajes de commit.
- No hay suite de tests; la verificación es tsc + build.
- No des formato que rompa el estilo local de cada archivo (api.ts y componentes sin punto y coma; archivos nuevos con punto y coma).
