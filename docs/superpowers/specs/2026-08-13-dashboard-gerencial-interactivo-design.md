# Spec: Dashboard Gerencial interactivo (estilo Daxus Latam)

Fecha: 2026-08-13
Estado: Aprobado por el usuario (luz verde para implementar y desplegar)

## Objetivo

Transformar `DashboardGerencial` en un dashboard analítico profesional y
"cool": negro absoluto (#000000), bordes/acentos amarillo corporativo
(#FFCC00), textos blancos (#FFFFFF), cero tonos azules o cian, con
gráficos que actúan como filtros activos (cross-filter) y un selector de
fechas global. Añadir una fila superior de Big Number Cards y tooltips
personalizados con precisión de un decimal. Código modular y eficiente
(sin re-renders innecesarios). Verificar con `tsc --noEmit`, `vite build`
y `purge-blue.mjs`, y desplegar a producción.

## Decisiones aprobadas (brainstorming)

- **Selector de fechas:** rango desde/hasta aplicado a `fecha_apertura`
  (expansiones) y `fecha_apertura_programada` (concesionarios).
- **Composición de gráficos:** una dona (estado operativo) + un gráfico de
  barras (aperturas por mes). Ambos interactivos.
- **Cross-filter:** bidireccional entre datasets. Click en una rebanada o
  barra filtra todas las demás tarjetas.
- **Enfoque:** carpeta `components/dashboard/` modular.

## Estructura de archivos

```
components/dashboard/
  DashboardGerencial.tsx   → composición (orquesta datos + filtros + secciones)
  useFiltrosDashboard.ts   → hook de estado y derivación memoizada
  SelectorFechas.tsx       → rango desde/hasta + chip "Limpiar filtros"
  BigNumberCard.tsx        → tarjeta de número grande con glow
  GraficoPie.tsx           → dona interactiva (React.memo)
  GraficoBarras.tsx        → barras interactivas (React.memo)
  tooltip.tsx              → tooltip personalizado compartido (1 decimal)
  kpis.ts                  → helpers puros (cálculo de KPIs)
  formateo.ts              → cuentaRegresiva, agruparPorPeriodo, keyMes
```

Se actualiza el import en `App.tsx` a `@components/dashboard/DashboardGerencial`.

## Pipeline de datos (cross-filter bidireccional)

`useFiltrosDashboard` recibe los arrays de `useConcesionarios` /
`useExpansiones` y mantiene:

```ts
filtros = {
  desde: Date | null,
  hasta: Date | null,
  estado: 'activo' | 'inactivo' | null,  // del gráfico de dona
  mes: 'YYYY-MM' | null,                 // del gráfico de barras
}
```

Derivación en cascada, todo memoizado con `useMemo`:

1. **Rango de fechas** → filtra `concesionarios` por `fecha_apertura_programada`
   y `expansiones` por `fecha_apertura` dentro de `[desde, hasta]`.
2. **Mapa de enlace** → `Map<concesionarioId, EstadoOperativo>` construido con
   los concesionarios ya filtrados por fecha.
3. **Filtro de estado** → conserva los concesionarios de ese estado y las
   expansiones cuyo `concesionario_id` apunta a uno de ese estado. Las
   expansiones sin concesionario vinculado quedan excluidas cuando hay un
   filtro de estado activo.
4. **Filtro de mes** (`YYYY-MM` de `fecha_apertura`) → conserva las expansiones
   con apertura en ese mes y los concesionarios con `fecha_apertura_programada`
   en ese mes.
5. **KPIs y datos de gráficos** calculados sobre los datasets ya filtrados.

Regla de oro: cada gráfico se calcula con todos los filtros excepto el suyo
propio, para seguir siendo un control útil. Click de nuevo en la misma
rebanada/barra desactiva el filtro. El botón "Limpiar filtros" resetea todo.
La rebanada/barra activa se muestra al 100% de opacidad con glow; el resto al
40%.

## Agregación de barras

- Rango ≤ 366 días → una barra por mes (ceros rellenos para los meses del
  rango, etiquetas tipo "Ene 2026" con `date-fns` + locale `es`).
- Rango > 366 días → una barra por año.

## Diseño visual

- Todas las tarjetas: `bg-black`, `border-mm-yellow/60`, `rounded-2xl`, glow
  sutil `shadow-[0_0_28px_rgba(255,204,0,0.14)]` que se intensifica en hover.
- Big Number Cards (fila superior, 3 en `lg:grid-cols-3`): **Total Red**
  (Building2), **% Progreso** (Target), **Próximas Aperturas** (Rocket).
  Números `text-5xl` blancos (el % en amarillo).
- Gráficos: `stroke="#000000"`, celdas desde `COLORES_CORPORATIVOS` (paleta ya
  sin azul/cian), glow amarillo en el contenedor.
- Tooltips: fondo `#0A0A0A`, borde 1px `#FFCC00`, texto blanco, porcentajes con
  un decimal.
- Textos secundarios solo `mm-gray-300/400`.
- Cero azul/cian: lo valida `purge-blue.mjs` en el build (ya existente).

## Eficiencia

- `React.memo` en `GraficoPie`, `GraficoBarras`, `SelectorFechas`,
  `BigNumberCard`.
- Derivación en una sola cadena de `useMemo`; callbacks estables con
  `useCallback`.
- Estilos de tooltip y colores como constantes a nivel de módulo (sin
  recrearlos por render).

## KPIs

Big Numbers: Total Red (concesionarios filtrados), % Progreso
(completadas/meta de aperturas filtradas, 1 decimal), Próximas Aperturas
(aperturas pendientes filtradas).

KPIs existentes que se conservan y recalculan sobre datasets filtrados:
activos, inactivos, en ejecución 2026, completadas 2026, departamentos
cubiertos, próxima apertura, próximas aperturas (top 3), meta de expansión y
accesos directos a Expansiones / Concesionarios.

## Verificación y despliegue

1. `npx.cmd tsc --noEmit -p tsconfig.app.json` (hoy pasa verde).
2. `npm.cmd run build --workspace=@mundo-motos/frontend` → ejecuta
   `vite build && node scripts/purge-blue.mjs`.
3. Commit (solo archivos del dashboard + import en `App.tsx`). No tocar
   `MapaConcesionarios.tsx` (tiene cambios sin commitear no relacionados).
4. Push a `origin/main` → Render auto-despliega `mundo-motos-frontend` y
   `mundo-motos-backend`. Confirmar con `render_list_deploys`.

## Fuera de alcance (YAGNI)

- No se añade tercer gráfico por departamento.
- No se introduce zustand para el estado de filtros.
- No se modifica el backend ni los hooks de datos.
