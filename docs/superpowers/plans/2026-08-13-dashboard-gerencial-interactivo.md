# Dashboard Gerencial Interactivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar `DashboardGerencial` en un dashboard analítico interactivo (estilo Daxus Latam): negro #000 / amarillo #FFCC00 / blanco, Big Number Cards, selector de fechas global, y gráficos (dona + barras) que actúan como filtros activos con cross-filter bidireccional.

**Architecture:** Carpeta `components/dashboard/` modular con piezas puras (helpers de KPIs/formatos), componentes de presentación `React.memo` (dona, barras, selector de fechas, big numbers, tooltip) y un hook `useFiltrosDashboard` que centraliza el estado de filtros y la derivación memoizada de datasets/KPIs/gráficos. `DashboardGerencial.tsx` queda como composición.

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS (paleta `mm-*`), Recharts 2, date-fns (locale `es`), lucide-react.

## Global Constraints

- TS `strict: true`, `moduleResolution: bundler`, aliases `@utils/*`, `@hooks/*`, `@types/*`, `@components/*`.
- Prettier: 2 espacios, comillas simples, punto y coma, printWidth 100.
- Todo en español (labels, mensajes, nombres de variables/helpers). Cero azul/cian: solo paleta `mm-*` y hexes del `branding.ts` / lista de `purge-blue.mjs`.
- **No añadir comentarios** en el código nuevo.
- No modificar backend, hooks (`useConcesionarios`/`useExpansiones`), ni `MapaConcesionarios.tsx` (tiene cambios sin commitear no relacionados).
- No existe infraestructura de tests en el repo: cada tarea verifica con `npx.cmd tsc --noEmit -p tsconfig.app.json` (debe salir limpio) desde `packages/frontend`.
- La verificación de "cero azul en el bundle" la hace `node scripts/purge-blue.mjs` (se ejecuta en `npm run build`).

## File Structure

```
packages/frontend/src/components/dashboard/
  formateo.ts                 → helpers puros de fechas/agrupación (cuentaRegresiva, clavePeriodo, agruparPorPeriodo)
  kpis.ts                     → helpers puros de KPIs (calcularKpis, datosPieEstado, es2026, DatosPie, KpisDashboard)
  tooltip.tsx                 → ESTILO_TOOLTIP + TooltipPersonalizado (1 decimal)
  GraficoPie.tsx              → dona interactiva (React.memo)
  GraficoBarras.tsx           → barras interactivas (React.memo)
  SelectorFechas.tsx          → rango desde/hasta + botón "Limpiar filtros" (React.memo)
  BigNumberCard.tsx           → tarjeta de número grande con glow (React.memo)
  useFiltrosDashboard.ts      → hook: estado de filtros + derivación memoizada
  DashboardGerencial.tsx      → composición (sustituye a components/DashboardGerencial.tsx)

Modificaciones:
  packages/frontend/src/App.tsx           → import apunta a @components/dashboard/DashboardGerencial
  (borrar) components/DashboardGerencial.tsx
```

Interfaces entre módulos:

- `formateo.ts`:
  - `cuentaRegresiva(fechaApertura: string): string`
  - `clavePeriodo(fecha: Date, porAnio: boolean): string` — `'yyyy-MM'` o `'yyyy'`
  - `agruparPorPeriodo(expansiones: Expansion[], desde: Date | null, hasta: Date | null): DatosBarra[]`
  - `export interface DatosBarra { clave: string; nombre: string; value: number }`
- `kpis.ts`:
  - `calcularKpis(concesionarios: Concesionario[], expansiones: Expansion[]): KpisDashboard`
  - `datosPieEstado(concesionarios: Concesionario[]): DatosPie[]`
  - `es2026(fecha: string): boolean`
  - `export interface DatosPie { name: string; value: number; color: string }`
  - `export interface KpisDashboard { total; activos; inactivos; proximas; enEjecucion; completadas; departamentos; porcentajeActivos; meta2026; completadas2026; progresoMeta; proximaApertura: Expansion | null; proximasAperturas: Expansion[] }`
- `tooltip.tsx`: `ESTILO_TOOLTIP: CSSProperties` y `TooltipPersonalizado({ active, label, payload, total?, formatearPorcentaje? })`
- `GraficoPie.tsx`: `GraficoPie({ datos: DatosPie[]; activo: string | null; onSeleccionar: (estado: string | null) => void })`
- `GraficoBarras.tsx`: `GraficoBarras({ datos: DatosBarra[]; activo: string | null; total: number; onSeleccionar: (clave: string | null) => void })`
- `SelectorFechas.tsx`: `SelectorFechas({ desde: Date | null; hasta: Date | null; hayFiltros: boolean; onCambiarRango: (d, h) => void; onLimpiar: () => void })`
- `BigNumberCard.tsx`: `BigNumberCard({ etiqueta: string; valor: ReactNode; detalle?: string; icono: LucideIcon; destacado?: boolean })`
- `useFiltrosDashboard.ts`:
  - `useFiltrosDashboard(concesionarios: Concesionario[], expansiones: Expansion[]): UseFiltrosDashboardReturn`
  - `UseFiltrosDashboardReturn`: `{ filtros: FiltrosDashboard; concesionariosFiltrados: Concesionario[]; expansionesFiltradas: Expansion[]; kpis: KpisDashboard; datosPie: DatosPie[]; datosBarras: DatosBarra[]; totalBarras: number; hayFiltros: boolean; cambiarRango(desde, hasta): void; seleccionarEstado(estado: string | null): void; seleccionarMes(clave: string | null): void; limpiarFiltros(): void }`
  - `FiltrosDashboard = { desde: Date | null; hasta: Date | null; estado: 'activo' | 'inactivo' | null; mes: string | null }`

---

### Task 1: Helpers puros de formatos y KPIs (`formateo.ts`, `kpis.ts`)

**Files:**
- Create: `packages/frontend/src/components/dashboard/formateo.ts`
- Create: `packages/frontend/src/components/dashboard/kpis.ts`

**Interfaces:**
- Consumes: `Expansion` (`../../types/expansion`), `Concesionario` (`../../types/concesionario`), `COLOR_ACTIVO`/`COLOR_INACTIVO` (`@utils/branding`).
- Produces: `cuentaRegresiva`, `clavePeriodo`, `agruparPorPeriodo`, `DatosBarra`, `calcularKpis`, `datosPieEstado`, `es2026`, `DatosPie`, `KpisDashboard` (usados por Tasks 3, 5, 6).

- [ ] **Step 1: Crear `formateo.ts`**

```ts
import { differenceInCalendarDays, format, parseISO, startOfDay, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Expansion } from '../../types/expansion'

export interface DatosBarra {
  clave: string
  nombre: string
  value: number
}

const DIAS_ANIO = 366

export function cuentaRegresiva(fechaApertura: string): string {
  const dias = differenceInCalendarDays(parseISO(fechaApertura), startOfDay(new Date()))
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias > 1) return `en ${dias} días`
  const pasados = Math.abs(dias)
  return pasados === 1 ? 'hace 1 día' : `hace ${pasados} días`
}

export function clavePeriodo(fecha: Date, porAnio: boolean): string {
  return porAnio ? String(fecha.getFullYear()) : format(fecha, 'yyyy-MM')
}

export function agruparPorPeriodo(
  expansiones: Expansion[],
  desde: Date | null,
  hasta: Date | null
): DatosBarra[] {
  const fechas = expansiones
    .map((e) => parseISO(e.fecha_apertura))
    .filter((f) => !Number.isNaN(f.getTime()))

  if (fechas.length === 0) return []

  const minimos = fechas.map((f) => f.getTime())
  let min = desde ?? new Date(Math.min(...minimos))
  let max = hasta ?? new Date(Math.max(...minimos))
  if (min.getTime() > max.getTime()) {
    ;[min, max] = [max, min]
  }
  const porAnio = differenceInCalendarDays(max, min) > DIAS_ANIO

  const conteo = new Map<string, number>()
  for (const f of fechas) {
    const clave = clavePeriodo(f, porAnio)
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
  }

  const datos: DatosBarra[] = []
  if (porAnio) {
    for (let anio = min.getFullYear(); anio <= max.getFullYear(); anio++) {
      const clave = String(anio)
      datos.push({ clave, nombre: clave, value: conteo.get(clave) ?? 0 })
    }
  } else {
    const cursor = startOfMonth(min)
    const fin = startOfMonth(max)
    while (cursor <= fin) {
      const clave = format(cursor, 'yyyy-MM')
      datos.push({
        clave,
        nombre: format(cursor, 'MMM yyyy', { locale: es }),
        value: conteo.get(clave) ?? 0,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }
  return datos
}
```

- [ ] **Step 2: Crear `kpis.ts`**

```ts
import { parseISO, startOfDay } from 'date-fns'
import { COLOR_ACTIVO, COLOR_INACTIVO } from '@utils/branding'
import { Concesionario } from '../../types/concesionario'
import { Expansion } from '../../types/expansion'

export interface DatosPie {
  name: string
  value: number
  color: string
}

export interface KpisDashboard {
  total: number
  activos: number
  inactivos: number
  proximas: number
  enEjecucion: number
  completadas: number
  departamentos: number
  porcentajeActivos: number
  meta2026: number
  completadas2026: number
  progresoMeta: number
  proximaApertura: Expansion | null
  proximasAperturas: Expansion[]
}

export function es2026(fecha: string): boolean {
  return parseISO(fecha).getFullYear() === 2026
}

export function calcularKpis(concesionarios: Concesionario[], expansiones: Expansion[]): KpisDashboard {
  const hoy = startOfDay(new Date())

  const activos = concesionarios.filter((c) => c.estado === 'activo').length
  const inactivos = concesionarios.filter((c) => c.estado === 'inactivo').length
  const proximas = expansiones.filter((e) => e.estado === 'proximo' && es2026(e.fecha_apertura)).length
  const enEjecucion = expansiones.filter((e) => e.estado === 'en_ejecucion' && es2026(e.fecha_apertura)).length
  const completadas = expansiones.filter((e) => e.estado === 'completado' && es2026(e.fecha_apertura)).length

  const meta2026 = expansiones.filter((e) => es2026(e.fecha_apertura)).length
  const completadas2026 = expansiones.filter((e) => e.estado === 'completado' && es2026(e.fecha_apertura)).length
  const progresoMeta = meta2026 > 0 ? (completadas2026 / meta2026) * 100 : 0

  const pendientes = expansiones
    .filter(
      (e) =>
        (e.estado === 'proximo' || e.estado === 'en_ejecucion') &&
        parseISO(e.fecha_apertura) >= hoy
    )
    .sort((a, b) => a.fecha_apertura.localeCompare(b.fecha_apertura))

  return {
    total: concesionarios.length,
    activos,
    inactivos,
    proximas,
    enEjecucion,
    completadas,
    departamentos: new Set(concesionarios.map((c) => c.departamento)).size,
    porcentajeActivos: concesionarios.length > 0 ? Math.round((activos / concesionarios.length) * 100) : 0,
    meta2026,
    completadas2026,
    progresoMeta,
    proximaApertura: pendientes[0] ?? null,
    proximasAperturas: pendientes.slice(0, 3),
  }
}

export function datosPieEstado(concesionarios: Concesionario[]): DatosPie[] {
  const activos = concesionarios.filter((c) => c.estado === 'activo').length
  const inactivos = concesionarios.filter((c) => c.estado === 'inactivo').length
  return [
    { name: 'Activos', value: activos, color: COLOR_ACTIVO },
    { name: 'Inactivos', value: inactivos, color: COLOR_INACTIVO },
  ]
}
```

- [ ] **Step 3: Verificar con tsc**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/dashboard/formateo.ts packages/frontend/src/components/dashboard/kpis.ts
git commit -m "feat(frontend): helpers de KPIs y formatos para el dashboard interactivo"
```

---

### Task 2: Tooltip personalizado compartido (`tooltip.tsx`)

**Files:**
- Create: `packages/frontend/src/components/dashboard/tooltip.tsx`

**Interfaces:**
- Consumes: `React` (solo tipos).
- Produces: `ESTILO_TOOLTIP: CSSProperties` y `TooltipPersonalizado` (usados por Tasks 3).

- [ ] **Step 1: Crear `tooltip.tsx`**

```tsx
import type { CSSProperties } from 'react'

export const ESTILO_TOOLTIP: CSSProperties = {
  backgroundColor: '#0A0A0A',
  border: '1px solid #FFCC00',
  borderRadius: '0.5rem',
  color: '#FFFFFF',
  boxShadow: '0 0 16px rgba(255, 204, 0, 0.25)',
  padding: '0.5rem 0.75rem',
}

interface EntradaTooltip {
  name?: string | number
  value?: string | number
  color?: string
  payload?: { name?: string; color?: string }
}

interface TooltipPersonalizadoProps {
  active?: boolean
  label?: string | number
  payload?: EntradaTooltip[]
  total?: number
  formatearPorcentaje?: boolean
}

export function TooltipPersonalizado({
  active,
  label,
  payload,
  total,
  formatearPorcentaje = false,
}: TooltipPersonalizadoProps) {
  if (!active || !payload || payload.length === 0) return null

  const totalValido = total != null && total > 0

  return (
    <div style={ESTILO_TOOLTIP}>
      {label != null && label !== '' && (
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mm-yellow">{label}</p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((entrada, indice) => {
          const valor = Number(entrada.value ?? 0)
          const color = entrada.color ?? entrada.payload?.color ?? '#FFCC00'
          const porcentaje = totalValido ? (valor / (total as number)) * 100 : null
          return (
            <li key={indice} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-mm-gray-300">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                {String(entrada.name ?? '')}
              </span>
              <span className="font-semibold text-white">
                {formatearPorcentaje && porcentaje != null
                  ? `${valor} · ${porcentaje.toFixed(1)}%`
                  : valor}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verificar con tsc**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/components/dashboard/tooltip.tsx
git commit -m "feat(frontend): tooltip personalizado con precision de un decimal"
```

---

### Task 3: Gráficos interactivos (dona y barras)

**Files:**
- Create: `packages/frontend/src/components/dashboard/GraficoPie.tsx`
- Create: `packages/frontend/src/components/dashboard/GraficoBarras.tsx`

**Interfaces:**
- Consumes: `DatosPie` (`./kpis`), `DatosBarra` (`./formateo`), `TooltipPersonalizado` (`./tooltip`).
- Produces: `GraficoPie`, `GraficoBarras` (usados por Task 6). Ambos son filtros activos: click toggle, atenuación al 40% de lo no activo, glow en lo activo.

- [ ] **Step 1: Crear `GraficoPie.tsx`**

```tsx
import { memo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { DatosPie } from './kpis'
import { TooltipPersonalizado } from './tooltip'

interface GraficoPieProps {
  datos: DatosPie[]
  activo: string | null
  onSeleccionar: (estado: string | null) => void
}

export const GraficoPie = memo(function GraficoPie({ datos, activo, onSeleccionar }: GraficoPieProps) {
  const total = datos.reduce((acumulado, d) => acumulado + d.value, 0)
  const porcentaje = (valor: number): number => (total > 0 ? (valor / total) * 100 : 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-mm-gray-700 py-10 text-sm text-mm-gray-400">
        Sin datos para mostrar.
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={datos}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={88}
            paddingAngle={2}
            stroke="#000000"
            strokeWidth={2}
            className="cursor-pointer"
            onClick={(entrada: unknown) => {
              const nombre = (entrada as { name?: string } | null)?.name
              onSeleccionar(nombre === activo ? null : nombre ?? null)
            }}
          >
            {datos.map((d) => (
              <Cell
                key={d.name}
                fill={d.color}
                opacity={activo && activo !== d.name ? 0.4 : 1}
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                  filter: activo === d.name ? 'drop-shadow(0 0 8px rgba(255, 204, 0, 0.5))' : undefined,
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<TooltipPersonalizado total={total} formatearPorcentaje />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-col gap-1.5">
        {datos.map((d) => {
          const seleccionado = activo === d.name
          return (
            <li key={d.name}>
              <button
                type="button"
                onClick={() => onSeleccionar(seleccionado ? null : d.name)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  seleccionado
                    ? 'border-mm-yellow/70 bg-mm-yellow/10'
                    : 'border-transparent hover:border-mm-yellow/40 hover:bg-mm-yellow/5'
                }`}
              >
                <span className="flex items-center gap-2 text-mm-gray-300">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: d.color,
                      boxShadow: seleccionado ? '0 0 8px rgba(255, 204, 0, 0.8)' : undefined,
                    }}
                  />
                  {d.name}
                </span>
                <span className="text-mm-gray-400">
                  {d.value} ·{' '}
                  <span className="font-semibold text-white">{porcentaje(d.value).toFixed(1)}%</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
})
```

- [ ] **Step 2: Crear `GraficoBarras.tsx`**

```tsx
import { memo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DatosBarra } from './formateo'
import { TooltipPersonalizado } from './tooltip'

interface GraficoBarrasProps {
  datos: DatosBarra[]
  activo: string | null
  total: number
  onSeleccionar: (clave: string | null) => void
}

export const GraficoBarras = memo(function GraficoBarras({
  datos,
  activo,
  total,
  onSeleccionar,
}: GraficoBarrasProps) {
  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-mm-gray-700 py-10 text-sm text-mm-gray-400">
        Sin datos para mostrar.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={datos} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="nombre"
          tick={{ fill: '#A3A3A3', fontSize: 11 }}
          axisLine={{ stroke: '#404040' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: '#A3A3A3', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255, 204, 0, 0.08)' }}
          content={<TooltipPersonalizado total={total} formatearPorcentaje />}
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          onClick={(entrada: unknown) => {
            const clave = (entrada as { clave?: string } | null)?.clave
            onSeleccionar(clave === activo ? null : clave ?? null)
          }}
        >
          {datos.map((d) => {
            const seleccionado = activo === d.clave
            return (
              <Cell
                key={d.clave}
                fill="#FFCC00"
                opacity={activo && !seleccionado ? 0.35 : 1}
                style={{
                  cursor: 'pointer',
                  filter: seleccionado ? 'drop-shadow(0 0 6px rgba(255, 204, 0, 0.6))' : undefined,
                }}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})
```

- [ ] **Step 3: Verificar con tsc**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/dashboard/GraficoPie.tsx packages/frontend/src/components/dashboard/GraficoBarras.tsx
git commit -m "feat(frontend): graficos de dona y barras interactivos como filtros activos"
```

---

### Task 4: Selector de fechas y Big Number Cards

**Files:**
- Create: `packages/frontend/src/components/dashboard/SelectorFechas.tsx`
- Create: `packages/frontend/src/components/dashboard/BigNumberCard.tsx`

**Interfaces:**
- Consumes: `date-fns` (`format`, `parseISO`), `lucide-react` (`CalendarRange`, `FilterX`), `LucideIcon`.
- Produces: `SelectorFechas`, `BigNumberCard` (usados por Task 6).

- [ ] **Step 1: Crear `SelectorFechas.tsx`**

```tsx
import { memo } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarRange, FilterX } from 'lucide-react'

interface SelectorFechasProps {
  desde: Date | null
  hasta: Date | null
  hayFiltros: boolean
  onCambiarRango: (desde: Date | null, hasta: Date | null) => void
  onLimpiar: () => void
}

function aISO(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd')
}

function aFecha(iso: string): Date | null {
  const f = parseISO(iso)
  return Number.isNaN(f.getTime()) ? null : f
}

export const SelectorFechas = memo(function SelectorFechas({
  desde,
  hasta,
  hayFiltros,
  onCambiarRango,
  onLimpiar,
}: SelectorFechasProps) {
  return (
    <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-mm-yellow/60 bg-black p-4 shadow-[0_0_28px_rgba(255,204,0,0.14)]">
      <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-mm-yellow text-mm-black">
        <CalendarRange className="h-4 w-4" />
      </span>
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-desde" className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
          Desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={desde ? aISO(desde) : ''}
          onChange={(e) => onCambiarRango(e.target.value ? aFecha(e.target.value) : null, hasta)}
          className="rounded-lg border border-mm-gray-700 bg-mm-gray-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-mm-yellow/70 [color-scheme:dark]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-hasta" className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
          Hasta
        </label>
        <input
          id="filtro-hasta"
          type="date"
          value={hasta ? aISO(hasta) : ''}
          onChange={(e) => onCambiarRango(desde, e.target.value ? aFecha(e.target.value) : null)}
          className="rounded-lg border border-mm-gray-700 bg-mm-gray-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-mm-yellow/70 [color-scheme:dark]"
        />
      </div>
      {hayFiltros && (
        <button
          type="button"
          onClick={onLimpiar}
          className="flex items-center gap-2 rounded-lg border border-mm-yellow/60 px-3 py-2 text-xs font-bold uppercase tracking-wider text-mm-yellow transition-colors hover:bg-mm-yellow/10"
        >
          <FilterX className="h-4 w-4" />
          Limpiar filtros
        </button>
      )}
    </section>
  )
})
```

- [ ] **Step 2: Crear `BigNumberCard.tsx`**

```tsx
import { memo, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface BigNumberCardProps {
  etiqueta: string
  valor: ReactNode
  detalle?: string
  icono: LucideIcon
  destacado?: boolean
}

export const BigNumberCard = memo(function BigNumberCard({
  etiqueta,
  valor,
  detalle,
  icono: Icono,
  destacado = false,
}: BigNumberCardProps) {
  return (
    <div className="rounded-2xl border border-mm-yellow/60 bg-black p-6 shadow-[0_0_28px_rgba(255,204,0,0.14)] transition-shadow hover:shadow-[0_0_36px_rgba(255,204,0,0.28)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">{etiqueta}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
          <Icono className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 text-5xl font-bold leading-none ${destacado ? 'text-mm-yellow' : 'text-white'}`}>{valor}</p>
      {detalle && <p className="mt-2 text-xs text-mm-gray-400">{detalle}</p>}
    </div>
  )
})
```

- [ ] **Step 3: Verificar con tsc**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/dashboard/SelectorFechas.tsx packages/frontend/src/components/dashboard/BigNumberCard.tsx
git commit -m "feat(frontend): selector de fechas global y big number cards con glow"
```

---

### Task 5: Hook de cross-filter (`useFiltrosDashboard.ts`)

**Files:**
- Create: `packages/frontend/src/components/dashboard/useFiltrosDashboard.ts`

**Interfaces:**
- Consumes: `Concesionario` (`../../types/concesionario`), `Expansion` (`../../types/expansion`), `clavePeriodo`, `agruparPorPeriodo` (`./formateo`), `calcularKpis`, `datosPieEstado`, `KpisDashboard`, `DatosPie` (`./kpis`), `DatosBarra` (`./formateo`).
- Produces: `useFiltrosDashboard`, `FiltrosDashboard`, `UseFiltrosDashboardReturn` (usado por Task 6).

- [ ] **Step 1: Crear `useFiltrosDashboard.ts`**

```ts
import { useCallback, useMemo, useState } from 'react'
import { parseISO } from 'date-fns'
import { Concesionario } from '../../types/concesionario'
import { Expansion } from '../../types/expansion'
import { agruparPorPeriodo, clavePeriodo, DatosBarra } from './formateo'
import { calcularKpis, datosPieEstado, DatosPie, KpisDashboard } from './kpis'

export type EstadoFiltro = 'activo' | 'inactivo' | null

export interface FiltrosDashboard {
  desde: Date | null
  hasta: Date | null
  estado: EstadoFiltro
  mes: string | null
}

const SIN_FILTROS: FiltrosDashboard = { desde: null, hasta: null, estado: null, mes: null }

export interface UseFiltrosDashboardReturn {
  filtros: FiltrosDashboard
  concesionariosFiltrados: Concesionario[]
  expansionesFiltradas: Expansion[]
  kpis: KpisDashboard
  datosPie: DatosPie[]
  datosBarras: DatosBarra[]
  totalBarras: number
  hayFiltros: boolean
  cambiarRango: (desde: Date | null, hasta: Date | null) => void
  seleccionarEstado: (estado: string | null) => void
  seleccionarMes: (clave: string | null) => void
  limpiarFiltros: () => void
}

function enRango(fecha: string, desde: Date | null, hasta: Date | null): boolean {
  if (!desde && !hasta) return true
  const f = parseISO(fecha)
  if (Number.isNaN(f.getTime())) return true
  if (desde && f.getTime() < desde.getTime()) return false
  if (hasta && f.getTime() > hasta.getTime()) return false
  return true
}

function enPeriodo(fechaISO: string, clave: string): boolean {
  const porAnio = /^\d{4}$/.test(clave)
  const f = parseISO(fechaISO)
  return clavePeriodo(f, porAnio) === clave
}

export function useFiltrosDashboard(
  concesionarios: Concesionario[],
  expansiones: Expansion[]
): UseFiltrosDashboardReturn {
  const [filtros, setFiltros] = useState<FiltrosDashboard>(SIN_FILTROS)

  const hayFiltros =
    filtros.desde != null || filtros.hasta != null || filtros.estado != null || filtros.mes != null

  const porFecha = useMemo(() => {
    const conRango = filtros.desde != null || filtros.hasta != null
    const concesionariosFiltrados = conRango
      ? concesionarios.filter(
          (c) =>
            c.fecha_apertura_programada != null &&
            enRango(c.fecha_apertura_programada, filtros.desde, filtros.hasta)
        )
      : concesionarios
    const expansionesFiltradas = conRango
      ? expansiones.filter((e) => enRango(e.fecha_apertura, filtros.desde, filtros.hasta))
      : expansiones
    return { concesionariosFiltrados, expansionesFiltradas }
  }, [concesionarios, expansiones, filtros.desde, filtros.hasta])

  const mapaEstados = useMemo(() => {
    const mapa = new Map<string, Concesionario['estado']>()
    for (const c of porFecha.concesionariosFiltrados) mapa.set(c.id, c.estado)
    return mapa
  }, [porFecha.concesionariosFiltrados])

  const conEstado = useMemo(() => {
    let concesionariosFiltrados = porFecha.concesionariosFiltrados
    let expansionesFiltradas = porFecha.expansionesFiltradas
    if (filtros.estado) {
      concesionariosFiltrados = concesionariosFiltrados.filter((c) => c.estado === filtros.estado)
      expansionesFiltradas = expansionesFiltradas.filter(
        (e) => e.concesionario_id != null && mapaEstados.get(e.concesionario_id) === filtros.estado
      )
    }
    return { concesionariosFiltrados, expansionesFiltradas }
  }, [porFecha, mapaEstados, filtros.estado])

  const datasetsFiltrados = useMemo(() => {
    let concesionariosFiltrados = conEstado.concesionariosFiltrados
    let expansionesFiltradas = conEstado.expansionesFiltradas
    if (filtros.mes) {
      concesionariosFiltrados = concesionariosFiltrados.filter(
        (c) => c.fecha_apertura_programada != null && enPeriodo(c.fecha_apertura_programada, filtros.mes)
      )
      expansionesFiltradas = expansionesFiltradas.filter((e) => enPeriodo(e.fecha_apertura, filtros.mes))
    }
    return { concesionariosFiltrados, expansionesFiltradas }
  }, [conEstado, filtros.mes])

  const kpis = useMemo(
    () => calcularKpis(datasetsFiltrados.concesionariosFiltrados, datasetsFiltrados.expansionesFiltradas),
    [datasetsFiltrados]
  )

  const concesionariosParaPie = useMemo(() => {
    let base = porFecha.concesionariosFiltrados
    if (filtros.mes) {
      base = base.filter(
        (c) => c.fecha_apertura_programada != null && enPeriodo(c.fecha_apertura_programada, filtros.mes)
      )
    }
    return base
  }, [porFecha.concesionariosFiltrados, filtros.mes])

  const datosPie = useMemo(() => datosPieEstado(concesionariosParaPie), [concesionariosParaPie])

  const expansionesParaBarras = useMemo(() => conEstado.expansionesFiltradas, [conEstado])

  const datosBarras = useMemo(
    () => agruparPorPeriodo(expansionesParaBarras, filtros.desde, filtros.hasta),
    [expansionesParaBarras, filtros.desde, filtros.hasta]
  )
  const totalBarras = useMemo(
    () => datosBarras.reduce((acumulado, d) => acumulado + d.value, 0),
    [datosBarras]
  )

  const cambiarRango = useCallback((desde: Date | null, hasta: Date | null) => {
    setFiltros((prev) => {
      if (desde && hasta && desde.getTime() > hasta.getTime()) {
        return { ...prev, desde: hasta, hasta: desde }
      }
      return { ...prev, desde, hasta }
    })
  }, [])

  const seleccionarEstado = useCallback((estado: string | null) => {
    setFiltros((prev) => ({
      ...prev,
      estado: estado === 'activo' || estado === 'inactivo' ? estado : null,
    }))
  }, [])

  const seleccionarMes = useCallback((clave: string | null) => {
    setFiltros((prev) => ({ ...prev, mes: clave }))
  }, [])

  const limpiarFiltros = useCallback(() => setFiltros(SIN_FILTROS), [])

  return {
    filtros,
    concesionariosFiltrados: datasetsFiltrados.concesionariosFiltrados,
    expansionesFiltradas: datasetsFiltrados.expansionesFiltradas,
    kpis,
    datosPie,
    datosBarras,
    totalBarras,
    hayFiltros,
    cambiarRango,
    seleccionarEstado,
    seleccionarMes,
    limpiarFiltros,
  }
}
```

- [ ] **Step 2: Verificar con tsc**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/components/dashboard/useFiltrosDashboard.ts
git commit -m "feat(frontend): hook de cross-filter bidireccional y rango de fechas global"
```

---

### Task 6: Composición `DashboardGerencial.tsx` + `App.tsx` + borrar el componente antiguo

**Files:**
- Create: `packages/frontend/src/components/dashboard/DashboardGerencial.tsx`
- Modify: `packages/frontend/src/App.tsx:4`
- Delete: `packages/frontend/src/components/DashboardGerencial.tsx`

**Interfaces:**
- Consumes: `useConcesionarios` (`@hooks/useConcesionarios`), `useExpansiones` (`@hooks/useExpansiones`), `useFiltrosDashboard`, `SelectorFechas`, `BigNumberCard`, `GraficoPie`, `GraficoBarras` (`./`), `cuentaRegresiva` (`./formateo`).
- Produces: `DashboardGerencial` (export nombrado + default), importado desde `@components/dashboard/DashboardGerencial` en `App.tsx`.

- [ ] **Step 1: Comprobar referencias al componente antiguo**

Run: `grep -rn "@components/DashboardGerencial" packages/frontend/src`
Expected: solo aparece en `App.tsx`.

- [ ] **Step 2: Crear `DashboardGerencial.tsx`**

```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Flag,
  Loader2,
  MapPin,
  Rocket,
  Target,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useConcesionarios } from '@hooks/useConcesionarios'
import { useExpansiones } from '@hooks/useExpansiones'
import { BigNumberCard } from './BigNumberCard'
import { GraficoBarras } from './GraficoBarras'
import { GraficoPie } from './GraficoPie'
import { SelectorFechas } from './SelectorFechas'
import { cuentaRegresiva } from './formateo'
import { useFiltrosDashboard } from './useFiltrosDashboard'

interface KpiCardProps {
  etiqueta: string
  valor: ReactNode
  detalle?: string
  icono: LucideIcon
  destacada?: boolean
}

function KpiCard({ etiqueta, valor, detalle, icono: Icono, destacada = false }: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border bg-black p-5 transition-colors ${
        destacada ? 'border-mm-yellow/70' : 'border-mm-gray-700 hover:border-mm-yellow/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">{etiqueta}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            destacada ? 'bg-mm-yellow text-mm-black' : 'bg-mm-gray-800 text-mm-yellow'
          }`}
        >
          <Icono className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-mm-gray-400">{detalle}</p>}
    </div>
  )
}

export function DashboardGerencial() {
  const {
    concesionarios,
    cargando: concesionariosCargando,
    error: concesionariosError,
    recargar: recargarConcesionarios,
  } = useConcesionarios()
  const {
    expansiones,
    cargando: expansionesCargando,
    error: expansionesError,
    recargar: recargarExpansiones,
  } = useExpansiones()

  const {
    filtros,
    concesionariosFiltrados,
    kpis,
    datosPie,
    datosBarras,
    totalBarras,
    hayFiltros,
    cambiarRango,
    seleccionarEstado,
    seleccionarMes,
    limpiarFiltros,
  } = useFiltrosDashboard(concesionarios, expansiones)

  const cargando = concesionariosCargando || expansionesCargando
  const error = concesionariosError || expansionesError

  if (cargando && concesionarios.length === 0 && expansiones.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-mm-gray-700 bg-mm-gray-800 px-4 py-12 text-sm text-mm-gray-300">
        <Loader2 className="h-5 w-5 animate-spin text-mm-yellow" />
        Cargando panel gerencial...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mm-yellow">
          Mundo Motos · Panel Gerencial
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Panel de Control <span className="text-mm-yellow">2026</span>
        </h2>
        <p className="text-sm text-mm-gray-400">
          Estado de la red de concesionarios y del plan de expansión. Haz clic en los gráficos para
          filtrar todo el panel.
        </p>
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-mm-error/40 bg-mm-error/10 px-4 py-3">
          <p className="text-sm text-mm-error">{error}</p>
          <button
            type="button"
            onClick={() => {
              recargarConcesionarios()
              recargarExpansiones()
            }}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error transition-colors hover:bg-mm-error/10"
          >
            Reintentar
          </button>
        </div>
      )}

      <SelectorFechas
        desde={filtros.desde}
        hasta={filtros.hasta}
        hayFiltros={hayFiltros}
        onCambiarRango={cambiarRango}
        onLimpiar={limpiarFiltros}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BigNumberCard
          etiqueta="Total red"
          valor={concesionariosFiltrados.length}
          detalle={`${kpis.departamentos} departamentos cubiertos`}
          icono={Building2}
        />
        <BigNumberCard
          etiqueta="Progreso de la meta"
          valor={`${kpis.progresoMeta.toFixed(1)}%`}
          detalle={`${kpis.completadas2026} de ${kpis.meta2026} aperturas completadas`}
          icono={Target}
          destacado
        />
        <BigNumberCard
          etiqueta="Próximas aperturas"
          valor={kpis.proximasAperturas.length}
          detalle={
            kpis.proximaApertura
              ? `Siguiente: ${kpis.proximaApertura.locacion.split(',')[0]}`
              : 'Sin aperturas pendientes'
          }
          icono={Rocket}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          etiqueta="Total concesionarios"
          valor={concesionariosFiltrados.length}
          detalle={`${kpis.departamentos} departamentos cubiertos`}
          icono={Building2}
        />
        <KpiCard
          etiqueta="Activos"
          valor={kpis.activos}
          detalle={`${kpis.porcentajeActivos}% de la red`}
          icono={CheckCircle2}
        />
        <KpiCard etiqueta="Inactivos" valor={kpis.inactivos} icono={XCircle} />
        <KpiCard etiqueta="Próximas aperturas 2026" valor={kpis.proximas} icono={Rocket} />

        <KpiCard etiqueta="En ejecución 2026" valor={kpis.enEjecucion} icono={TrendingUp} />
        <KpiCard etiqueta="Completadas 2026" valor={kpis.completadas} icono={Flag} />

        <div className="flex flex-col gap-4 rounded-xl border border-mm-yellow/70 bg-black p-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
              <CalendarClock className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
                Próxima apertura
              </p>
              {kpis.proximaApertura ? (
                <>
                  <p className="truncate text-xl font-bold text-white">
                    {kpis.proximaApertura.concesionario}
                  </p>
                  <p className="text-sm text-mm-gray-400">
                    {format(parseISO(kpis.proximaApertura.fecha_apertura), 'EEEE d MMMM yyyy', {
                      locale: es,
                    })}{' '}
                    ·{' '}
                    <span className="font-semibold text-mm-yellow">
                      {cuentaRegresiva(kpis.proximaApertura.fecha_apertura)}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-mm-gray-400">Sin aperturas programadas.</p>
              )}
            </div>
          </div>
          {kpis.proximaApertura && kpis.proximaApertura.estado === 'en_ejecucion' && (
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-mm-gray-800 sm:w-40">
                <div
                  className="h-full rounded-full bg-mm-yellow"
                  style={{ width: `${kpis.proximaApertura.avance}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-mm-gray-300">
                {kpis.proximaApertura.avance}%
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-mm-yellow/70 bg-black p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
              <Target className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
                Meta de expansión 2026
              </p>
              <p className="text-2xl font-bold text-white">
                {kpis.completadas2026} <span className="text-mm-gray-400">de</span>{' '}
                {kpis.meta2026}{' '}
                <span className="text-base font-medium text-mm-gray-400">aperturas completadas</span>
              </p>
            </div>
          </div>
          <p className="text-4xl font-bold text-mm-yellow">{kpis.progresoMeta.toFixed(1)}%</p>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-mm-gray-800">
          <div
            className="h-full rounded-full bg-mm-yellow transition-all duration-500"
            style={{ width: `${Math.min(100, kpis.progresoMeta)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-mm-gray-400">
          Progreso calculado de forma dinámica en función de las aperturas programadas y completadas
          para el año 2026.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-mm-yellow/60 bg-black p-5 shadow-[0_0_28px_rgba(255,204,0,0.14)]">
          <h3 className="mb-1 text-sm font-bold text-white">Estado operativo de la red</h3>
          <p className="mb-4 text-xs text-mm-gray-400">
            Distribución de concesionarios por estado operativo. Haz clic para filtrar.
          </p>
          <GraficoPie datos={datosPie} activo={filtros.estado} onSeleccionar={seleccionarEstado} />
        </div>
        <div className="rounded-2xl border border-mm-yellow/60 bg-black p-5 shadow-[0_0_28px_rgba(255,204,0,0.14)]">
          <h3 className="mb-1 text-sm font-bold text-white">Aperturas por periodo</h3>
          <p className="mb-4 text-xs text-mm-gray-400">
            Distribución de las aperturas en el rango seleccionado. Haz clic para filtrar.
          </p>
          <GraficoBarras
            datos={datosBarras}
            activo={filtros.mes}
            total={totalBarras}
            onSeleccionar={seleccionarMes}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Link
          to="/expansiones"
          className="group flex flex-col gap-4 rounded-xl border border-mm-gray-700 bg-black p-6 transition-colors hover:border-mm-yellow/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mm-gray-800 text-mm-yellow">
                <Rocket className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white">Cronograma de Expansiones</p>
                <p className="text-xs text-mm-gray-400">Plan de aperturas 2026</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-mm-yellow transition-transform group-hover:translate-x-1" />
          </div>

          <div className="rounded-lg border border-mm-gray-800 bg-mm-gray-800/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
              Próximas aperturas
            </p>
            {kpis.proximasAperturas.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {kpis.proximasAperturas.map((expansion) => (
                  <li key={expansion.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-mm-gray-200">
                      {expansion.locacion.split(',')[0]}
                    </span>
                    <span className="shrink-0 text-xs text-mm-gray-400">
                      {format(parseISO(expansion.fecha_apertura), 'd MMM', { locale: es })} ·{' '}
                      <span className="text-mm-yellow">
                        {cuentaRegresiva(expansion.fecha_apertura)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mm-gray-400">Sin aperturas programadas.</p>
            )}
          </div>

          <span className="mt-auto text-xs font-bold uppercase tracking-wider text-mm-yellow">
            Abrir cronograma
          </span>
        </Link>

        <Link
          to="/concesionarios"
          className="group flex flex-col gap-4 rounded-xl border border-mm-gray-700 bg-black p-6 transition-colors hover:border-mm-yellow/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mm-gray-800 text-mm-yellow">
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white">Gestión de Concesionarios</p>
                <p className="text-xs text-mm-gray-400">Mapa, filtros y mantenimiento</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-mm-yellow transition-transform group-hover:translate-x-1" />
          </div>

          <div className="rounded-lg border border-mm-gray-800 bg-mm-gray-800/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
              Estado de la red
            </p>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-mm-gray-200">
                {kpis.activos} de {concesionariosFiltrados.length} activos
              </span>
              <span className="font-semibold text-mm-yellow">{kpis.porcentajeActivos}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-mm-gray-800">
              <div
                className="h-full rounded-full bg-mm-yellow"
                style={{ width: `${kpis.porcentajeActivos}%` }}
              />
            </div>
          </div>

          <span className="mt-auto text-xs font-bold uppercase tracking-wider text-mm-yellow">
            Gestionar concesionarios
          </span>
        </Link>
      </section>
    </div>
  )
}

export default DashboardGerencial
```

- [ ] **Step 3: Actualizar `App.tsx`**

En `packages/frontend/src/App.tsx:4`, reemplazar:

```ts
import DashboardGerencial from '@components/DashboardGerencial'
```

por:

```ts
import DashboardGerencial from '@components/dashboard/DashboardGerencial'
```

- [ ] **Step 4: Borrar el componente antiguo**

```bash
git rm packages/frontend/src/components/DashboardGerencial.tsx
```

- [ ] **Step 5: Verificar con tsc**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida, exit code 0.

- [ ] **Step 6: Verificar build completo + purge-blue**

Run (en la raíz del repo): `npm.cmd run build --workspace=@mundo-motos/frontend`
Expected: `vite build` termina sin errores y el script imprime `[purge-blue] OK: N archivo(s) purgados. CERO rastro de azul/cian y grises azulados en dist/.`

- [ ] **Step 7: Commit**

```bash
git add packages/frontend/src/components/dashboard packages/frontend/src/App.tsx
git commit -m "feat(frontend): dashboard gerencial interactivo con cross-filter, rango de fechas y big numbers"
```

---

### Task 7: Verificación final y despliegue

**Files:**
- Ninguno (solo git).

**Interfaces:**
- Consumes: los commits de Tasks 1-6.

- [ ] **Step 1: Verificar estado del working tree**

Run: `git status --short`
Expected: solo cambios intencionales (dashboard + App.tsx); `MapaConcesionarios.tsx` NO debe estar incluido en el commit.

- [ ] **Step 2: Re-verificar type-check y build**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida, exit code 0.
Run (raíz): `npm.cmd run build --workspace=@mundo-motos/frontend`
Expected: build OK + `[purge-blue] OK`.

- [ ] **Step 3: Push a origin/main**

```bash
git push origin main
```

Expected: push exitoso (Render auto-despliega `mundo-motos-frontend` y `mundo-motos-backend`).

- [ ] **Step 4: Confirmar despliegue en Render**

Run: `render_list_deploys` para `srv-d9ulhcfavr4c73arprvg` (frontend) y `srv-d9ulhc3ncjis739ug9vg` (backend).
Expected: aparece un nuevo deploy para cada servicio tras el push; verificar que el frontend termina en estado `live`/`deployed` (o al menos que el deploy fue disparado y está buildando).
