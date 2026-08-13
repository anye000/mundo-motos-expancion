# Design: Analítica gerencial — Meta de Expansión 2026, gráficos de pastel y Reportes Avanzados

Fecha: 2026-08-13
Estado: Aprobado

## Objetivo

Ampliar las capacidades analíticas del CRM Mundo Motos manteniendo de forma estricta la paleta
corporativa (fondo negro absoluto `#000000`, acentos/gráficos amarillo `#FFCC00`, texto blanco
`#FFFFFF`; **cero azul/cian**):

1. **Meta de Expansión de Concesionarios** en el `DashboardGerencial`, calculada de forma
   dinámica a partir de las aperturas programadas y completadas del año 2026, con barra de
   avance y porcentaje con decimales (ej. `65.4%`).
2. **Gráficos de pastel (recharts)** en el `DashboardGerencial`:
   - Distribución de concesionarios por estado operativo (Activos vs Inactivos) con porcentajes
     a un decimal.
   - Distribución de aperturas de expansión **por mes** (2026).
   - Porciones solo con la paleta corporativa (amarillo, blanco y grises neutros oscuros).
3. **Vista de Reportes Avanzados** en `/reportes` (`ReportesView.tsx`), accesible desde el
   Navbar, con filtros combinables (concesionario específico, estado, ciudad, rango de semanas y
   meses de 2026) y exportación a CSV de la tabla filtrada (interacciones, aperturas o
   rendimiento comercial).
4. Verificación: type-check (backend y frontend) y `vite build` en verde; commit y push.

## Decisiones tomadas

- **Meta de Expansión 2026 — dinámica**: `meta` = total de aperturas del plan 2026 (estados
  `proximo`, `en_ejecucion` y `completado` con `fecha_apertura` en 2026). `completadas` = las de
  estado `completado`. `progreso = completadas / meta × 100` con 1 decimal. Si `meta = 0`,
  progreso `0.0%`. Se recalcula solo al registrarse/avanzar aperturas (no hay meta fija).
- **Segundo pastel — por mes**: 12 porciones (Ene–Dic 2026). No se usa "región" porque
  `expansiones.locacion` es texto libre sin campo de región explícito.
- **Reportes — endpoint nuevo en backend**: `GET /api/v1/reportes` con filtros combinados
  (`concesionario_id`, `estado`, `ciudad`, `fecha_desde`, `fecha_hasta`). Devuelve en una sola
  llamada `concesionarios` (filtrados, para selects/contexto), `interacciones` (con join de
  nombre/ciudad/estado del concesionario), `aperturas` (expansiones del plan) y `rendimiento`
  (fila agregada por concesionario).
- **Contenido del reporte — pestañas**: Interacciones (listado crudo), Aperturas (expansiones
  del plan) y Rendimiento (tabla agregada por concesionario). Cada pestaña exportable a CSV.
- **Sin cambios de esquema**: las expansiones se vinculan al concesionario por **nombre**
  (campo `concesionario`), no por id. El servicio de reportes resuelve los nombres de los
  concesionarios filtrados y cruza con `expansiones.concesionario`.
- **Paleta de gráficos**: constantes propias (ver sección *Paleta corporativa para recharts*).
  Nunca se usan hex azules/cianes (el build ya falla con `purge-blue.mjs` si quedan).
- **Ubicación de `ReportesView.tsx`**: en `src/components/` (convención actual: todas las vistas
  viven en `components/`), importada desde `App.tsx` con alias `@components`.

## Arquitectura

### 1. Backend — módulo `reportes`

Nuevo módulo siguiendo el patrón `concesionarios/` (`reporte.{model,service,controller,routes}.ts`
+ `index.ts`), montado en `src/index.ts` como `app.use('/api/v1/reportes', reportesRouter)` y
añadido al placeholder `GET /api/v1`.

- **`reporte.model.ts`**: `ReporteFilters` (`concesionario_id?`, `estado?`, `ciudad?`,
  `fecha_desde?`, `fecha_hasta?`), `FilaRendimiento`, `ReporteData`.
- **`reporte.service.ts`** — `getReportes(filters): Promise<ReporteData>`:
  1. Consulta `concesionarios` con filtros (`eq id`, `eq estado`, `ilike ciudad`, `is deleted_at
     null`), límite 500, orden alfabético.
  2. Consulta `interacciones_crm` con `concesionarios!inner(...)` para aplicar estado/ciudad/id
     del concesionario y `gte/lte created_at` por rango de fechas. Devuelve las filas crudas +
     campos del concesionario (nombre, ciudad, estado). Límite 1000, orden `created_at desc`.
  3. Consulta `expansiones` con `gte/lte fecha_apertura` por rango; si hay filtros de
     concesionario (id, estado o ciudad), resuelve la lista de nombres de los concesionarios
     filtrados y aplica `.in('concesionario', nombres)`. Límite 1000, orden por fecha.
  4. Arma `rendimiento` en JS a partir de las tres consultas: por cada concesionario →
     `total_interacciones` (count por `concesionario_id`), `ultima_interaccion` (created_at máx.),
     `aperturas_programadas` (expansiones del plan, sin filtrar por estado), `aperturas_completadas`
     y `en_ejecucion`, y `avance_promedio` (media de `avance` sobre las expansiones del
     concesionario, 1 decimal).
- **`reporte.controller.ts`**: extrae `queryString`/`queryNumber` (mismo patrón que el resto de
  módulos), valida estados, y responde con `sendSuccess`.
- **`reporte.routes.ts`**: `GET /` → `getReportes`.
- **Errores**: `ApiError(400)` si `fecha_desde > fecha_hasta` o fechas inválidas; errores de
  Supabase con `mapSupabaseError`.

### 2. Frontend — `DashboardGerencial`

- **Meta de Expansión 2026**: tarjeta destacada (borde `mm-yellow`) con barra de progreso,
  "X de Y completadas" y porcentaje a 1 decimal. Se deriva en el `useMemo` de KPIs actual.
- **Pie 1 — Estado operativo** (Activos/Inactivos): `PieChart` con `Cell` por porción, leyenda
  personalizada con valor + `%.1f`. Colores `#FFCC00` (activo) y `#A3A3A3` (inactivo).
- **Pie 2 — Aperturas 2026 por mes**: 12 porciones con la paleta corporativa cíclica.
- Detalles recharts: `ResponsiveContainer` con altura fija, `stroke="#000000"` en los bordes,
  `Tooltip` con fondo `#0A0A0A`, borde `#404040` y texto blanco, formatter con porcentaje a 1
  decimal. Estado vacío (texto + borde punteado) si no hay datos (evita warnings de recharts).
- El cálculo de porcentajes usa `(valor / total) * 100` con `toFixed(1)`.

### 3. Frontend — `ReportesView` (`/reportes`)

- **Navbar** (`App.tsx`): nuevo link `{ to: '/reportes', etiqueta: 'Reportes', icono: BarChart3 }`
  y ruta `<Route path="/reportes" element={<ReportesView />} />`.
- **Filtros** (auto-aplicados al cambiar + botón Limpiar):
  - Select **Concesionario**: la lista del desplegable se alimenta con `useConcesionarios`
    (lista completa, estable), mientras que el endpoint de reportes aplica el id seleccionado
    como filtro de datos.
  - Select **Estado** (activo/inactivo/todos).
  - Select **Ciudad** (ciudades únicas).
  - Select **Semana desde / hasta** (1–53) y **Mes desde / hasta** (Ene–Dic 2026).
  - Conversión a `fecha_desde`/`fecha_hasta` con date-fns:
    - Semana ISO: `startOfISOWeek(addWeeks(new Date(2026, 0, 4), semana - 1))` / `endOfISOWeek`.
    - Mes: `startOfMonth` / `endOfMonth` sobre `new Date(2026, mesIdx, 1)`.
    - Si solo se elige un extremo, el otro queda como límite del año 2026.
- **Pestañas** (comparten filtros):
  - **Interacciones**: tabla cruda (tipo, concesionario, ciudad, estado, detalles, responsable,
    fecha).
  - **Aperturas**: tabla de expansiones (concesionario, locación, fecha, estado, avance).
  - **Rendimiento**: tabla agregada (concesionario, ciudad, estado, interacciones, última
    interacción, aperturas programadas/completadas, avance promedio).
- **Exportar CSV** por pestaña: construye el CSV en el cliente (con BOM `\uFEFF` para acentos en
  Excel) y descarga vía `Blob` + `URL.createObjectURL`.
- **Hook `useReportes`** (`src/hooks/useReportes.ts`): gestiona estado, carga, error y recarga.
- **Tipos** `src/types/reporte.ts` y método `getReportes` en `src/services/api.ts`.
- Estados de carga/error con la identidad visual actual (`Loader2` amarillo, banner `mm-error`).

### 4. Paleta corporativa para recharts

Constante compartida en `src/utils/branding.ts`:

```ts
export const COLORES_CORPORATIVOS = [
  '#FFCC00', '#FFFFFF', '#E6B800', '#D4D4D4', '#FFF1A8', '#A3A3A3',
  '#FFD633', '#737373', '#FFE680', '#525252', '#FFDB4D', '#404040',
]
export const COLOR_ACTIVO = '#FFCC00'
export const COLOR_INACTIVO = '#A3A3A3'
```

Ninguno de estos hex está en la lista prohibida de `purge-blue.mjs`.

## Error handling

- Backend: `ApiError` con `statusCode`; `mapSupabaseError` para errores de Supabase; el error
  handler global ya responde `err.statusCode || err.status`.
- Frontend: `useReportes` captura errores y los expone como mensaje; la vista muestra banner de
  error con botón Reintentar, igual que el resto del CRM. Exportar CSV con datos vacíos muestra
  un toast informativo.

## Verificación

- `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`
- `npx.cmd tsc --noEmit -p tsconfig.app.json` (frontend)
- `npm.cmd run build --workspace=@mundo-motos/frontend` (tsc + vite build + `purge-blue.mjs`)
- Commit con mensaje en español y push a `origin/main`.
