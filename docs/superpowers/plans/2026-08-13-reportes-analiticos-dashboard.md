# Analítica Gerencial: Meta 2026, Pasteles y Reportes Avanzados — Plan de Implementación

> **Para agentes de ejecución:** SUB-SKILL REQUERIDO: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkboxes (`- [ ]`).

**Objetivo:** Añadir la meta dinámica de expansión 2026 y dos gráficos de pastel (recharts) al `DashboardGerencial`, y crear la vista `/reportes` (ReportesView) con filtros combinados, pestañas y exportación CSV, respaldada por un endpoint nuevo `GET /api/v1/reportes`.

**Arquitectura:** El backend agrega un módulo `reportes` (patrón `concesionarios/`) que combina `concesionarios`, `interacciones_crm` y `expansiones` en una sola respuesta. El frontend consume el endpoint con un hook propio, renderiza los pasteles con recharts usando paleta corporativa y muestra la vista de reportes con filtros de semana/mes (ISO) convertidos a `fecha_desde`/`fecha_hasta`.

**Tech Stack:** Express + Supabase (backend), React 18 + TypeScript + Tailwind + recharts 2.10 + date-fns (frontend).

## Constraints Globales

- Backend: módulos siguiendo el patrón `concesionarios/` (`*.model.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`, `index.ts`), snake_case alineado a Supabase, comentarios/mensajes en español, estilo con punto y coma (`;`).
- Frontend: vistas en `src/components/`, estilo **sin** punto y coma, comillas simples, indentación 2 espacios. Clases Tailwind existentes (`mm-black`, `mm-yellow`, `mm-gray-*`, `input-dark`) e iconos `lucide-react`.
- **Marca estricta**: fondo `#000000`, acentos/gráficos `#FFCC00`, texto blanco, grises neutros. CERO azul/cian. Los gráficos usan únicamente `COLORES_CORPORATIVOS` (nunca hex azules — el build falla con `scripts/purge-blue.mjs` si quedan).
- Comandos con `npm.cmd`/`npx.cmd` (PowerShell bloquea `npm.ps1`/`npx.ps1`). Ejecutar scripts de paquete directamente, no Turbo.
- No existe infraestructura de tests en el repo; la verificación por tarea es `tsc --noEmit` y el build final con `purge-blue.mjs` (requisito del usuario). No escribir tests unitarios.
- Verificación por tarea:
  - Backend: `npx.cmd tsc --noEmit -p tsconfig.json` (cwd `packages/backend`)
  - Frontend: `npx.cmd tsc --noEmit -p tsconfig.app.json` (cwd `packages/frontend`)
  - Build completo: `npm.cmd run build --workspace=@mundo-motos/frontend`
- Commits frecuentes con mensajes en español.

## Estructura de Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `packages/backend/src/modules/reportes/reporte.model.ts` | Crear | Tipos `ReporteFilters`, `InteraccionReporte`, `FilaRendimiento`, `ReporteData` |
| `packages/backend/src/modules/reportes/reporte.service.ts` | Crear | Consultas Supabase + agregación de rendimiento |
| `packages/backend/src/modules/reportes/reporte.controller.ts` | Crear | Capa HTTP del endpoint |
| `packages/backend/src/modules/reportes/reporte.routes.ts` | Crear | Router Express |
| `packages/backend/src/modules/reportes/index.ts` | Crear | Re-export del módulo |
| `packages/backend/src/index.ts` | Modificar | Montar router y listar en placeholder |
| `packages/frontend/src/utils/branding.ts` | Crear | Paleta corporativa para gráficos |
| `packages/frontend/src/types/reporte.ts` | Crear | Tipos del reporte (frontend) |
| `packages/frontend/src/services/api.ts` | Modificar | Método `getReportes` |
| `packages/frontend/src/hooks/useReportes.ts` | Crear | Hook de carga del reporte |
| `packages/frontend/src/components/DashboardGerencial.tsx` | Modificar | Meta 2026 + 2 pasteles |
| `packages/frontend/src/components/ReportesView.tsx` | Crear | Vista `/reportes` con filtros/pestañas/CSV |
| `packages/frontend/src/App.tsx` | Modificar | Link "Reportes" + ruta |

---

### Task 1: Backend — módulo `reportes`

**Archivos:**
- Crear: `packages/backend/src/modules/reportes/reporte.model.ts`
- Crear: `packages/backend/src/modules/reportes/reporte.service.ts`
- Crear: `packages/backend/src/modules/reportes/reporte.controller.ts`
- Crear: `packages/backend/src/modules/reportes/reporte.routes.ts`
- Crear: `packages/backend/src/modules/reportes/index.ts`
- Modificar: `packages/backend/src/index.ts`

**Interfaces:**
- Consume: `Concesionario`/`EstadoOperativo` de `../concesionarios/concesionario.model`, `InteraccionCrm` de `../crm/crm.model`, `Expansion` de `../expansiones/expansion.model`, `sendSuccess` de `@utils/helpers`, `mapSupabaseError` de `@utils/supabase-errors`, `supabase` de `@config/supabase`.
- Produce: `GET /api/v1/reportes` → `{ success, data: { concesionarios, interacciones, aperturas, rendimiento } }`.

- [ ] **Paso 1: Crear `reporte.model.ts`**

```ts
/**
 * Modelo de datos del módulo Reportes.
 *
 * Tipos del endpoint GET /api/v1/reportes que combina concesionarios,
 * interacciones CRM y expansiones del plan en una sola respuesta.
 * Se usa snake_case para alinear directamente con las columnas de Supabase.
 */

import { Concesionario, EstadoOperativo } from '../concesionarios/concesionario.model';
import { InteraccionCrm } from '../crm/crm.model';
import { Expansion } from '../expansiones/expansion.model';

/** Filtros soportados por GET /api/v1/reportes. */
export interface ReporteFilters {
  concesionario_id?: string;
  estado?: EstadoOperativo;
  ciudad?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

/** Interacción enriquecida con datos del concesionario para la tabla de reportes. */
export interface InteraccionReporte extends InteraccionCrm {
  concesionario_nombre: string;
  concesionario_ciudad: string;
  concesionario_estado: EstadoOperativo;
}

/** Fila de rendimiento comercial agregada por concesionario. */
export interface FilaRendimiento {
  concesionario_id: string;
  nombre: string;
  ciudad: string;
  departamento: string;
  estado: EstadoOperativo;
  total_interacciones: number;
  ultima_interaccion: string | null;
  aperturas_programadas: number;
  aperturas_completadas: number;
  aperturas_en_ejecucion: number;
  avance_promedio: number;
}

/** Respuesta completa de GET /api/v1/reportes. */
export interface ReporteData {
  concesionarios: Concesionario[];
  interacciones: InteraccionReporte[];
  aperturas: Expansion[];
  rendimiento: FilaRendimiento[];
}
```

- [ ] **Paso 2: Crear `reporte.service.ts`**

```ts
/**
 * Servicio del módulo Reportes.
 *
 * Combina datos de `concesionarios`, `interacciones_crm` y `expansiones`
 * mediante el cliente de Supabase. Lanza ApiError con códigos de estado HTTP
 * adecuados; los controladores los propagan al error handler global.
 */

import { ApiError } from '@utils/helpers';
import { mapSupabaseError } from '@utils/supabase-errors';
import { supabase } from '@config/supabase';
import { Concesionario } from '../concesionarios/concesionario.model';
import { InteraccionCrm } from '../crm/crm.model';
import { Expansion } from '../expansiones/expansion.model';
import {
  ReporteFilters,
  ReporteData,
  InteraccionReporte,
  FilaRendimiento,
} from './reporte.model';

const LIMITE_MAX = 1000;

function validarFechaRango(fechaDesde?: string, fechaHasta?: string): void {
  if (fechaDesde && Number.isNaN(Date.parse(fechaDesde))) {
    throw new ApiError('El campo "fecha_desde" debe ser una fecha válida (YYYY-MM-DD)', 400);
  }
  if (fechaHasta && Number.isNaN(Date.parse(fechaHasta))) {
    throw new ApiError('El campo "fecha_hasta" debe ser una fecha válida (YYYY-MM-DD)', 400);
  }
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
    throw new ApiError('La fecha "desde" no puede ser mayor que "hasta"', 400);
  }
}

/**
 * Genera el reporte combinado: concesionarios filtrados, interacciones (con
 * datos del concesionario), aperturas del plan y filas de rendimiento
 * agregadas por concesionario.
 */
export async function getReportes(filters: ReporteFilters = {}): Promise<ReporteData> {
  const concesionarioId = filters.concesionario_id?.trim();
  const estado = filters.estado;
  const ciudad = filters.ciudad?.trim();
  const fechaDesde = filters.fecha_desde?.trim();
  const fechaHasta = filters.fecha_hasta?.trim();

  validarFechaRango(fechaDesde, fechaHasta);

  const hayFiltroConcesionario = Boolean(concesionarioId || estado || ciudad);

  // 1) Concesionarios con filtros combinados (id, estado, ciudad).
  let queryConcesionarios = supabase
    .from('concesionarios')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);
  if (concesionarioId) {
    queryConcesionarios = queryConcesionarios.eq('id', concesionarioId);
  }
  if (estado) {
    queryConcesionarios = queryConcesionarios.eq('estado', estado);
  }
  if (ciudad) {
    queryConcesionarios = queryConcesionarios.ilike('ciudad', `%${ciudad}%`);
  }
  const { data: concesionarios, error: errorConcesionarios } = await queryConcesionarios
    .order('nombre', { ascending: true })
    .limit(500)
    .returns<Concesionario[]>();
  if (errorConcesionarios) {
    throw mapSupabaseError(errorConcesionarios, 'Error al obtener los concesionarios');
  }
  const lista = concesionarios ?? [];
  const ids = lista.map((c) => c.id);
  const nombres = lista.map((c) => c.nombre);

  // 2) Interacciones del rango (solo si hay concesionarios para filtrar).
  let interacciones: InteraccionCrm[] = [];
  if (!hayFiltroConcesionario || ids.length > 0) {
    let queryInteracciones = supabase.from('interacciones_crm').select('*');
    if (hayFiltroConcesionario) {
      queryInteracciones = queryInteracciones.in('concesionario_id', ids);
    }
    if (fechaDesde) {
      queryInteracciones = queryInteracciones.gte('created_at', fechaDesde);
    }
    if (fechaHasta) {
      queryInteracciones = queryInteracciones.lte('created_at', fechaHasta);
    }
    const { data, error } = await queryInteracciones
      .order('created_at', { ascending: false })
      .limit(LIMITE_MAX)
      .returns<InteraccionCrm[]>();
    if (error) {
      throw mapSupabaseError(error, 'Error al obtener las interacciones');
    }
    interacciones = data ?? [];
  }

  // 3) Aperturas del plan en el rango (filtradas por los nombres de los
  //    concesionarios cuando hay filtros de concesionario).
  let aperturas: Expansion[] = [];
  if (!hayFiltroConcesionario || nombres.length > 0) {
    let queryAperturas = supabase.from('expansiones').select('*').is('deleted_at', null);
    if (hayFiltroConcesionario) {
      queryAperturas = queryAperturas.in('concesionario', nombres);
    }
    if (fechaDesde) {
      queryAperturas = queryAperturas.gte('fecha_apertura', fechaDesde);
    }
    if (fechaHasta) {
      queryAperturas = queryAperturas.lte('fecha_apertura', fechaHasta);
    }
    const { data, error } = await queryAperturas
      .order('fecha_apertura', { ascending: true })
      .limit(LIMITE_MAX)
      .returns<Expansion[]>();
    if (error) {
      throw mapSupabaseError(error, 'Error al obtener las aperturas');
    }
    aperturas = data ?? [];
  }

  // 4) Agregación de rendimiento en JS (datos pequeños: sin N+1 perceptible).
  const concesionarioPorId = new Map(lista.map((c) => [c.id, c]));
  const interaccionesPorConcesionario = new Map<string, InteraccionCrm[]>();
  for (const interaccion of interacciones) {
    const actuales = interaccionesPorConcesionario.get(interaccion.concesionario_id) ?? [];
    actuales.push(interaccion);
    interaccionesPorConcesionario.set(interaccion.concesionario_id, actuales);
  }
  const aperturasPorConcesionario = new Map<string, Expansion[]>();
  for (const apertura of aperturas) {
    const actuales = aperturasPorConcesionario.get(apertura.concesionario) ?? [];
    actuales.push(apertura);
    aperturasPorConcesionario.set(apertura.concesionario, actuales);
  }

  const rendimiento: FilaRendimiento[] = lista.map((concesionario) => {
    const inters = interaccionesPorConcesionario.get(concesionario.id) ?? [];
    const exps = aperturasPorConcesionario.get(concesionario.nombre) ?? [];
    const completadas = exps.filter((e) => e.estado === 'completado').length;
    const enEjecucion = exps.filter((e) => e.estado === 'en_ejecucion').length;
    const sumaAvances = exps.reduce((acc, e) => acc + e.avance, 0);
    const avancePromedio = exps.length > 0 ? sumaAvances / exps.length : 0;
    return {
      concesionario_id: concesionario.id,
      nombre: concesionario.nombre,
      ciudad: concesionario.ciudad,
      departamento: concesionario.departamento,
      estado: concesionario.estado,
      total_interacciones: inters.length,
      ultima_interaccion: inters.length > 0 ? inters[0].created_at : null,
      aperturas_programadas: exps.length,
      aperturas_completadas: completadas,
      aperturas_en_ejecucion: enEjecucion,
      avance_promedio: Math.round(avancePromedio * 10) / 10,
    };
  });

  const interaccionesReporte: InteraccionReporte[] = interacciones.map((interaccion) => {
    const concesionario = concesionarioPorId.get(interaccion.concesionario_id);
    return {
      ...interaccion,
      concesionario_nombre: concesionario?.nombre ?? 'Desconocido',
      concesionario_ciudad: concesionario?.ciudad ?? '',
      concesionario_estado: concesionario?.estado ?? 'inactivo',
    };
  });

  return {
    concesionarios: lista,
    interacciones: interaccionesReporte,
    aperturas,
    rendimiento,
  };
}
```

- [ ] **Paso 3: Crear `reporte.controller.ts`**

```ts
/**
 * Controlador del módulo Reportes.
 *
 * Capa HTTP: extrae parámetros de la petición, delega en el servicio y
 * responde usando los helpers de @utils/helpers. Los errores se propagan
 * con next() al error handler global de Express.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@utils/helpers';
import * as reporteService from './reporte.service';
import { ReporteFilters } from './reporte.model';
import { EstadoOperativo } from '../concesionarios/concesionario.model';

const ESTADOS_VALIDOS: EstadoOperativo[] = ['activo', 'inactivo'];

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/** GET /api/v1/reportes - reporte combinado con filtros. */
export async function getReportes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const estado = queryString(req.query.estado);
    const filters: ReporteFilters = {
      concesionario_id: queryString(req.query.concesionario_id),
      estado:
        estado && (ESTADOS_VALIDOS as string[]).includes(estado)
          ? (estado as EstadoOperativo)
          : undefined,
      ciudad: queryString(req.query.ciudad),
      fecha_desde: queryString(req.query.fecha_desde),
      fecha_hasta: queryString(req.query.fecha_hasta),
    };
    const data = await reporteService.getReportes(filters);
    sendSuccess(res, data, 'Reporte generado exitosamente');
  } catch (error) {
    next(error);
  }
}
```

- [ ] **Paso 4: Crear `reporte.routes.ts`**

```ts
/**
 * Rutas del módulo Reportes.
 *
 * Router de Express montado en /api/v1/reportes desde src/index.ts.
 */

import { Router } from 'express';
import { getReportes } from './reporte.controller';

const reportesRouter: Router = Router();

reportesRouter.get('/', getReportes);

export default reportesRouter;
```

- [ ] **Paso 5: Crear `index.ts` del módulo**

```ts
/**
 * Módulo Reportes
 * Reportes combinados de concesionarios, interacciones y expansiones
 */

export { default } from './reporte.routes';
export * from './reporte.routes';
export * from './reporte.model';
export * as reporteService from './reporte.service';
```

- [ ] **Paso 6: Montar el router en `packages/backend/src/index.ts`**

Edits (3):
1. Tras `import expansionesRouter from './modules/expansiones/expansion.routes'` añade:
```ts
import reportesRouter from './modules/reportes/reporte.routes'
```
2. Tras `app.use('/api/v1/expansiones', expansionesRouter)` añade:
```ts
app.use('/api/v1/reportes', reportesRouter)
```
3. En el placeholder `GET /api/v1`, tras `expansiones: '/api/v1/expansiones',` añade:
```ts
reportes: '/api/v1/reportes',
```

- [ ] **Paso 7: Verificar type-check backend**

Run (cwd `packages/backend`): `npx.cmd tsc --noEmit -p tsconfig.json`
Expected: sin salida y exit code 0.

- [ ] **Paso 8: Commit**

```bash
git add packages/backend/src/modules/reportes packages/backend/src/index.ts
git commit -m "feat(backend): endpoint de reportes combinados (concesionarios, interacciones, aperturas, rendimiento)"
```

---

### Task 2: Frontend — infraestructura de datos del reporte

**Archivos:**
- Crear: `packages/frontend/src/utils/branding.ts`
- Crear: `packages/frontend/src/types/reporte.ts`
- Modificar: `packages/frontend/src/services/api.ts`
- Crear: `packages/frontend/src/hooks/useReportes.ts`

**Interfaces:**
- Consume: `ReporteData`/`ReporteFilters` (Task 2), `apiService` de `@services/api`.
- Produce: `COLOR_ACTIVO`, `COLOR_INACTIVO`, `COLORES_CORPORATIVOS` (de `@utils/branding`); `apiService.getReportes(filters: ReporteFilters): Promise<ReporteData>`; `useReportes(filtros: ReporteFilters)` → `{ datos, cargando, error, recargar }`.

- [ ] **Paso 1: Crear `src/utils/branding.ts`**

```ts
/** Paleta corporativa para gráficos (recharts) — cero azul/cian. */

export const COLOR_ACTIVO = '#FFCC00'
export const COLOR_INACTIVO = '#A3A3A3'

export const COLORES_CORPORATIVOS = [
  '#FFCC00',
  '#FFFFFF',
  '#E6B800',
  '#D4D4D4',
  '#FFF1A8',
  '#A3A3A3',
  '#FFD633',
  '#737373',
  '#FFE680',
  '#525252',
  '#FFDB4D',
  '#404040',
]
```

- [ ] **Paso 2: Crear `src/types/reporte.ts`**

```ts
/** Tipos del módulo Reportes alineados con el backend (snake_case). */

import { Concesionario, EstadoOperativo } from './concesionario'
import { InteraccionCrm } from './interaccion'
import { Expansion } from './expansion'

export interface ReporteFilters {
  concesionario_id?: string
  estado?: EstadoOperativo
  ciudad?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface InteraccionReporte extends InteraccionCrm {
  concesionario_nombre: string
  concesionario_ciudad: string
  concesionario_estado: EstadoOperativo
}

export interface FilaRendimiento {
  concesionario_id: string
  nombre: string
  ciudad: string
  departamento: string
  estado: EstadoOperativo
  total_interacciones: number
  ultima_interaccion: string | null
  aperturas_programadas: number
  aperturas_completadas: number
  aperturas_en_ejecucion: number
  avance_promedio: number
}

export interface ReporteData {
  concesionarios: Concesionario[]
  interacciones: InteraccionReporte[]
  aperturas: Expansion[]
  rendimiento: FilaRendimiento[]
}
```

- [ ] **Paso 3: Añadir import y método `getReportes` en `src/services/api.ts`**

1. Añade al bloque de imports existente:
```ts
import { ReporteData, ReporteFilters } from '../types/reporte'
```
2. Añade el método justo antes de la llave de cierre de `class ApiService` (tras `deleteExpansion`):
```ts
  /** GET /api/v1/reportes - reporte combinado con filtros. */
  async getReportes(filters: ReporteFilters = {}): Promise<ReporteData> {
    const response = await this.get<ReporteData>('/reportes', { params: filters })
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al obtener el reporte')
    }
    return response.data
  }
```

- [ ] **Paso 4: Crear `src/hooks/useReportes.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import { apiService } from '@services/api'
import { ReporteData, ReporteFilters } from '../types/reporte'

export interface UseReportesReturn {
  datos: ReporteData | null
  cargando: boolean
  error: string | null
  recargar: () => void
}

/**
 * Hook de datos de la vista de Reportes: consulta GET /api/v1/reportes con
 * los filtros combinados y expone recargar() para refrescarlos.
 */
export function useReportes(filtros: ReporteFilters): UseReportesReturn {
  const [datos, setDatos] = useState<ReporteData | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (activos: ReporteFilters) => {
    setCargando(true)
    setError(null)
    try {
      const resultado = await apiService.getReportes(activos)
      setDatos(resultado)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el reporte')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  const recargar = useCallback(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  return { datos, cargando, error, recargar }
}

export default useReportes
```

> Nota: `useReportes` depende de `filtros` por identidad de objeto. Quien lo use debe pasar un objeto estable con `useMemo` (de primitivas) para evitar bucles de re-consulta.

- [ ] **Paso 5: Verificar type-check frontend**

Run (cwd `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida y exit code 0.

- [ ] **Paso 6: Commit**

```bash
git add packages/frontend/src/utils/branding.ts packages/frontend/src/types/reporte.ts packages/frontend/src/services/api.ts packages/frontend/src/hooks/useReportes.ts
git commit -m "feat(frontend): infraestructura de reportes (paleta corporativa, tipos, api y hook)"
```

---

### Task 3: Frontend — `DashboardGerencial`: Meta 2026 + gráficos de pastel

**Archivos:**
- Modificar: `packages/frontend/src/components/DashboardGerencial.tsx`

**Interfaces:**
- Consume: `COLOR_ACTIVO`, `COLOR_INACTIVO`, `COLORES_CORPORATIVOS` de `@utils/branding`; recharts; `format`/`parseISO` de date-fns con locale `es`.
- Produce: helper `es2026(fecha: string): boolean`, componente `GraficoPie({ datos: DatosPie[] })` con leyenda de porcentajes a 1 decimal; en el `useMemo` de KPIs: `meta2026`, `completadas2026`, `progresoMeta` (0–100, con decimales).

- [ ] **Paso 1: Ajustar imports**

1. Quita la línea `import { Expansion } from '../types/expansion'` (quedará sin uso).
2. Añade tras el import de `useExpansiones`:
```tsx
import { COLOR_ACTIVO, COLOR_INACTIVO, COLORES_CORPORATIVOS } from '@utils/branding'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
```
3. Añade `Target` al import de `lucide-react` (tras `Rocket`).

- [ ] **Paso 2: Añadir helper y componente `GraficoPie` tras `KpiCard`**

```tsx
function es2026(fecha: string): boolean {
  return parseISO(fecha).getFullYear() === 2026
}

interface DatosPie {
  name: string
  value: number
  color: string
}

function GraficoPie({ datos }: { datos: DatosPie[] }) {
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
          >
            {datos.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #404040',
              borderRadius: '0.5rem',
              color: '#FFFFFF',
            }}
            itemStyle={{ color: '#FFFFFF' }}
            formatter={(value: unknown, name: unknown) => [
              `${String(value)} (${porcentaje(Number(value)).toFixed(1)}%)`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-col gap-1.5">
        {datos.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-mm-gray-300">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.name}
            </span>
            <span className="text-mm-gray-400">
              {d.value} ·{' '}
              <span className="font-semibold text-white">{porcentaje(d.value).toFixed(1)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Paso 3: Ampliar el `useMemo` de KPIs**

1. Sustituye `const en2026 = (e: Expansion) => parseISO(e.fecha_apertura).getFullYear() === 2026` por el uso de `es2026` y añade las métricas de meta. El bloque interior pasa a ser:

```ts
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
```

2. En el objeto `return` del mismo `useMemo`, añade:

```ts
      meta2026,
      completadas2026,
      progresoMeta,
```

- [ ] **Paso 4: Añadir datos de los pasteles tras el `useMemo` de KPIs**

```tsx
  const datosEstado = useMemo<DatosPie[]>(
    () => [
      { name: 'Activos', value: kpis.activos, color: COLOR_ACTIVO },
      { name: 'Inactivos', value: kpis.inactivos, color: COLOR_INACTIVO },
    ],
    [kpis]
  )

  const datosAperturasMes = useMemo<DatosPie[]>(() => {
    const porMes = new Array<number>(12).fill(0)
    for (const e of expansiones) {
      if (es2026(e.fecha_apertura)) {
        porMes[parseISO(e.fecha_apertura).getMonth()] += 1
      }
    }
    return porMes.map((value, indice) => ({
      name: format(new Date(2026, indice, 1), 'MMM', { locale: es }),
      value,
      color: COLORES_CORPORATIVOS[indice % COLORES_CORPORATIVOS.length],
    }))
  }, [expansiones])
```

- [ ] **Paso 5: Insertar las secciones de Meta y Gráficos en el JSX**

Inserta tras el cierre del `<section>` de KPIs (antes de `{/* Accesos directos */}`):

```tsx
      {/* Meta de expansión 2026 */}
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
          Progreso calculado de forma dinámica en función de las aperturas programadas y
          completadas para el año 2026.
        </p>
      </section>

      {/* Gráficos analíticos */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-mm-gray-700 bg-black p-5">
          <h3 className="mb-1 text-sm font-bold text-white">Estado operativo de la red</h3>
          <p className="mb-4 text-xs text-mm-gray-400">
            Distribución de concesionarios por estado operativo.
          </p>
          <GraficoPie datos={datosEstado} />
        </div>
        <div className="rounded-xl border border-mm-gray-700 bg-black p-5">
          <h3 className="mb-1 text-sm font-bold text-white">Aperturas 2026 por mes</h3>
          <p className="mb-4 text-xs text-mm-gray-400">
            Distribución mensual de las aperturas programadas en el plan de expansión.
          </p>
          <GraficoPie datos={datosAperturasMes} />
        </div>
      </section>
```

- [ ] **Paso 6: Verificar type-check frontend**

Run (cwd `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida y exit code 0.

- [ ] **Paso 7: Commit**

```bash
git add packages/frontend/src/components/DashboardGerencial.tsx
git commit -m "feat(frontend): meta de expansion 2026 y graficos de pastel corporativos en el dashboard gerencial"
```

---

### Task 4: Frontend — `ReportesView` y ruta `/reportes`

**Archivos:**
- Crear: `packages/frontend/src/components/ReportesView.tsx`
- Modificar: `packages/frontend/src/App.tsx`

**Interfaces:**
- Consume: `useReportes(filtrosApi)` (Task 2), `useConcesionarios` (lista del select), `apiService.getUsuarios()` (responsables), tipos `ReporteFilters`/`FilaRendimiento` (Task 2).
- Produce: componente `ReportesView` (default) montado en `/reportes`; nuevo link "Reportes" en el navbar.

- [ ] **Paso 1: Crear `src/components/ReportesView.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  addWeeks,
  endOfISOWeek,
  endOfMonth,
  endOfYear,
  format,
  max,
  min,
  parseISO,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart3, Download, FilterX, Loader2 } from 'lucide-react'
import { useConcesionarios } from '@hooks/useConcesionarios'
import { useReportes } from '@hooks/useReportes'
import { apiService } from '@services/api'
import { EstadoOperativo } from '../types/concesionario'
import { EstadoExpansion } from '../types/expansion'
import { TipoInteraccion } from '../types/interaccion'
import { Usuario } from '../types/usuario'
import { ReporteFilters } from '../types/reporte'

const TIPO_INTERACCION_LABEL: Record<TipoInteraccion, string> = {
  llamada: 'Llamada',
  visita: 'Visita',
  nota_rapida: 'Nota rápida',
  incidencia: 'Incidencia',
}

const ESTADO_EXPANSION_LABEL: Record<EstadoExpansion, string> = {
  proximo: 'Próximo',
  en_ejecucion: 'En ejecución',
  completado: 'Completado',
}

const SEMANAS_2026 = Array.from({ length: 53 }, (_, i) => i + 1)
const MESES_2026 = Array.from({ length: 12 }, (_, i) => i + 1)

const INICIO_SEMANA_1_2026 = startOfISOWeek(new Date(2026, 0, 4))

interface FiltrosReportes {
  concesionario_id: string
  estado: EstadoOperativo | ''
  ciudad: string
  semanaDesde: string
  semanaHasta: string
  mesDesde: string
  mesHasta: string
}

const FILTROS_INICIALES: FiltrosReportes = {
  concesionario_id: '',
  estado: '',
  ciudad: '',
  semanaDesde: '',
  semanaHasta: '',
  mesDesde: '',
  mesHasta: '',
}

type Pestana = 'interacciones' | 'aperturas' | 'rendimiento'

interface ColumnaCSV {
  clave: string
  encabezado: string
}

function fechaDesdeSemana(semana: string): Date | null {
  if (!semana) return null
  return startOfISOWeek(addWeeks(INICIO_SEMANA_1_2026, Number(semana) - 1))
}

function fechaHastaSemana(semana: string): Date | null {
  if (!semana) return null
  return endOfISOWeek(addWeeks(INICIO_SEMANA_1_2026, Number(semana) - 1))
}

function TablaReporte({
  columnas,
  filas,
  vacio,
}: {
  columnas: ColumnaCSV[]
  filas: Record<string, unknown>[]
  vacio: string
}) {
  if (filas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-mm-gray-700 bg-mm-gray-900 py-10 text-center text-sm text-mm-gray-400">
        {vacio}
      </p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-mm-gray-700 bg-mm-gray-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-mm-gray-700 bg-mm-gray-900 text-xs uppercase tracking-wider text-mm-gray-400">
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} className="px-3 py-2.5 font-semibold">
                {c.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-mm-gray-700">
          {filas.map((fila, indice) => (
            <tr key={indice} className="transition-colors hover:bg-mm-gray-900">
              {columnas.map((c) => (
                <td key={c.clave} className="px-3 py-2.5 text-mm-gray-200">
                  {String(fila[c.clave] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReportesView() {
  const {
    concesionarios,
    ciudades,
    cargando: cargandoConcesionarios,
    error: errorConcesionarios,
    recargar: recargarConcesionarios,
  } = useConcesionarios()
  const [filtros, setFiltros] = useState<FiltrosReportes>(FILTROS_INICIALES)
  const [pestana, setPestana] = useState<Pestana>('interacciones')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    let activo = true
    apiService
      .getUsuarios()
      .then((lista) => {
        if (activo) setUsuarios(lista)
      })
      .catch(() => undefined)
    return () => {
      activo = false
    }
  }, [])

  const limites = useMemo(() => {
    const desdeSemana = fechaDesdeSemana(filtros.semanaDesde)
    const hastaSemana = fechaHastaSemana(filtros.semanaHasta)
    const desdeMes = filtros.mesDesde
      ? startOfMonth(new Date(2026, Number(filtros.mesDesde) - 1, 1))
      : null
    const hastaMes = filtros.mesHasta
      ? endOfMonth(new Date(2026, Number(filtros.mesHasta) - 1, 1))
      : null
    const candidatosDesde = [desdeSemana, desdeMes].filter((d): d is Date => d !== null)
    const candidatosHasta = [hastaSemana, hastaMes].filter((d): d is Date => d !== null)
    let desdeFinal =
      candidatosDesde.length > 0 ? max(candidatosDesde) : startOfYear(new Date(2026, 0, 1))
    let hastaFinal =
      candidatosHasta.length > 0 ? min(candidatosHasta) : endOfYear(new Date(2026, 0, 1))
    if (desdeFinal.getTime() > hastaFinal.getTime()) {
      const temporal = desdeFinal
      desdeFinal = hastaFinal
      hastaFinal = temporal
    }
    return {
      fecha_desde: format(desdeFinal, 'yyyy-MM-dd'),
      fecha_hasta: format(hastaFinal, 'yyyy-MM-dd'),
    }
  }, [filtros.semanaDesde, filtros.semanaHasta, filtros.mesDesde, filtros.mesHasta])

  const filtrosApi = useMemo<ReporteFilters>(
    () => ({
      concesionario_id: filtros.concesionario_id || undefined,
      estado: filtros.estado || undefined,
      ciudad: filtros.ciudad || undefined,
      fecha_desde: limites.fecha_desde,
      fecha_hasta: limites.fecha_hasta,
    }),
    [filtros.concesionario_id, filtros.estado, filtros.ciudad, limites.fecha_desde, limites.fecha_hasta]
  )

  const { datos, cargando, error, recargar } = useReportes(filtrosApi)

  const cambiarFiltro = (campo: keyof FiltrosReportes, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  const limpiarFiltros = () => setFiltros(FILTROS_INICIALES)

  const nombreResponsable = (id: string): string => {
    const usuario = usuarios.find((u) => u.id === id)
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '—'
  }

  const filasInteracciones = useMemo(
    () =>
      (datos?.interacciones ?? []).map((i) => ({
        fecha: format(new Date(i.created_at), 'dd/MM/yyyy HH:mm'),
        tipo: TIPO_INTERACCION_LABEL[i.tipo],
        concesionario_nombre: i.concesionario_nombre,
        concesionario_ciudad: i.concesionario_ciudad,
        concesionario_estado: i.concesionario_estado,
        detalles: i.detalles,
        responsable: nombreResponsable(i.usuario_responsable),
      })),
    [datos, usuarios]
  )

  const filasAperturas = useMemo(
    () =>
      (datos?.aperturas ?? []).map((e) => ({
        concesionario: e.concesionario,
        locacion: e.locacion,
        fecha_apertura: format(parseISO(e.fecha_apertura), 'dd/MM/yyyy'),
        estado: ESTADO_EXPANSION_LABEL[e.estado],
        avance: `${e.avance}%`,
        observaciones: e.observaciones ?? '',
      })),
    [datos]
  )

  const filasRendimiento = useMemo(
    () =>
      (datos?.rendimiento ?? []).map((r) => ({
        nombre: r.nombre,
        ciudad: r.ciudad,
        departamento: r.departamento,
        estado: r.estado,
        total_interacciones: r.total_interacciones,
        ultima_interaccion: r.ultima_interaccion
          ? format(new Date(r.ultima_interaccion), 'dd/MM/yyyy HH:mm')
          : '—',
        aperturas_programadas: r.aperturas_programadas,
        aperturas_completadas: r.aperturas_completadas,
        aperturas_en_ejecucion: r.aperturas_en_ejecucion,
        avance_promedio: `${r.avance_promedio.toFixed(1)}%`,
      })),
    [datos]
  )

  const columnasInteracciones: ColumnaCSV[] = [
    { clave: 'fecha', encabezado: 'Fecha' },
    { clave: 'tipo', encabezado: 'Tipo' },
    { clave: 'concesionario_nombre', encabezado: 'Concesionario' },
    { clave: 'concesionario_ciudad', encabezado: 'Ciudad' },
    { clave: 'concesionario_estado', encabezado: 'Estado' },
    { clave: 'detalles', encabezado: 'Detalles' },
    { clave: 'responsable', encabezado: 'Responsable' },
  ]
  const columnasAperturas: ColumnaCSV[] = [
    { clave: 'concesionario', encabezado: 'Concesionario' },
    { clave: 'locacion', encabezado: 'Locación' },
    { clave: 'fecha_apertura', encabezado: 'Fecha apertura' },
    { clave: 'estado', encabezado: 'Estado' },
    { clave: 'avance', encabezado: 'Avance' },
    { clave: 'observaciones', encabezado: 'Observaciones' },
  ]
  const columnasRendimiento: ColumnaCSV[] = [
    { clave: 'nombre', encabezado: 'Concesionario' },
    { clave: 'ciudad', encabezado: 'Ciudad' },
    { clave: 'departamento', encabezado: 'Departamento' },
    { clave: 'estado', encabezado: 'Estado' },
    { clave: 'total_interacciones', encabezado: 'Interacciones' },
    { clave: 'ultima_interaccion', encabezado: 'Última interacción' },
    { clave: 'aperturas_programadas', encabezado: 'Aperturas programadas' },
    { clave: 'aperturas_completadas', encabezado: 'Aperturas completadas' },
    { clave: 'aperturas_en_ejecucion', encabezado: 'En ejecución' },
    { clave: 'avance_promedio', encabezado: 'Avance promedio' },
  ]

  function descargarCSV(
    nombreArchivo: string,
    columnas: ColumnaCSV[],
    filas: Record<string, unknown>[]
  ) {
    if (filas.length === 0) {
      toast.error('No hay datos que coincidan con los filtros para exportar')
      return
    }
    const escapar = (valor: unknown): string => {
      const texto = String(valor ?? '')
      return `"${texto.replace(/"/g, '""')}"`
    }
    const lineas = [
      columnas.map((c) => c.encabezado).join(';'),
      ...filas.map((fila) => columnas.map((c) => escapar(fila[c.clave])).join(';')),
    ]
    const blob = new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    URL.revokeObjectURL(url)
    toast.success('Reporte CSV exportado')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mm-yellow">
          Mundo Motos · Reportes Avanzados
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Reportes <span className="text-mm-yellow">2026</span>
        </h2>
        <p className="text-sm text-mm-gray-400">
          Filtra interacciones, aperturas y rendimiento comercial por concesionario, estado,
          ciudad y rangos de semanas/meses del año 2026.
        </p>
      </section>

      {/* Filtros */}
      <section className="rounded-xl border border-mm-gray-700 bg-mm-gray-800 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <BarChart3 className="h-4 w-4 text-mm-yellow" />
            Filtros del reporte
          </h3>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="flex items-center gap-1.5 rounded-lg border border-mm-gray-600 px-3 py-1.5 text-xs font-semibold text-mm-gray-300 transition-colors hover:bg-mm-gray-700 hover:text-white"
          >
            <FilterX className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">Concesionario</span>
            <select
              className="input-dark"
              value={filtros.concesionario_id}
              onChange={(e) => cambiarFiltro('concesionario_id', e.target.value)}
            >
              <option value="">Todos</option>
              {concesionarios.length === 0 && cargandoConcesionarios && (
                <option value="">Cargando...</option>
              )}
              {concesionarios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">Estado</span>
            <select
              className="input-dark"
              value={filtros.estado}
              onChange={(e) => cambiarFiltro('estado', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">Ciudad</span>
            <select
              className="input-dark"
              value={filtros.ciudad}
              onChange={(e) => cambiarFiltro('ciudad', e.target.value)}
            >
              <option value="">Todas</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">
                Semana desde
              </span>
              <select
                className="input-dark"
                value={filtros.semanaDesde}
                onChange={(e) => cambiarFiltro('semanaDesde', e.target.value)}
              >
                <option value="">—</option>
                {SEMANAS_2026.map((s) => (
                  <option key={s} value={String(s)}>
                    Semana {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">Semana hasta</span>
              <select
                className="input-dark"
                value={filtros.semanaHasta}
                onChange={(e) => cambiarFiltro('semanaHasta', e.target.value)}
              >
                <option value="">—</option>
                {SEMANAS_2026.map((s) => (
                  <option key={s} value={String(s)}>
                    Semana {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-end gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">Mes desde</span>
              <select
                className="input-dark"
                value={filtros.mesDesde}
                onChange={(e) => cambiarFiltro('mesDesde', e.target.value)}
              >
                <option value="">—</option>
                {MESES_2026.map((m) => (
                  <option key={m} value={String(m)}>
                    {format(new Date(2026, m - 1, 1), 'MMMM', { locale: es })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">Mes hasta</span>
              <select
                className="input-dark"
                value={filtros.mesHasta}
                onChange={(e) => cambiarFiltro('mesHasta', e.target.value)}
              >
                <option value="">—</option>
                {MESES_2026.map((m) => (
                  <option key={m} value={String(m)}>
                    {format(new Date(2026, m - 1, 1), 'MMMM', { locale: es })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-mm-gray-400 sm:col-span-2 lg:col-span-2">
            Rango aplicado: del {limites.fecha_desde} al {limites.fecha_hasta}.
          </p>
        </div>
      </section>

      {errorConcesionarios && (
        <div className="flex items-center justify-between rounded-xl border border-mm-error/40 bg-mm-error/10 px-4 py-3">
          <p className="text-sm text-mm-error">{errorConcesionarios}</p>
          <button
            type="button"
            onClick={recargarConcesionarios}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error transition-colors hover:bg-mm-error/10"
          >
            Reintentar
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-mm-error/40 bg-mm-error/10 px-4 py-3">
          <p className="text-sm text-mm-error">{error}</p>
          <button
            type="button"
            onClick={recargar}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error transition-colors hover:bg-mm-error/10"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Pestañas + exportar */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-xl border border-mm-gray-700 bg-mm-gray-800 p-1">
            {(
              [
                ['interacciones', 'Interacciones'],
                ['aperturas', 'Aperturas'],
                ['rendimiento', 'Rendimiento'],
              ] as [Pestana, string][]
            ).map(([clave, etiqueta]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setPestana(clave)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  pestana === clave
                    ? 'bg-mm-yellow text-mm-black'
                    : 'text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (pestana === 'interacciones') {
                descargarCSV('reporte-interacciones.csv', columnasInteracciones, filasInteracciones)
              } else if (pestana === 'aperturas') {
                descargarCSV('reporte-aperturas.csv', columnasAperturas, filasAperturas)
              } else {
                descargarCSV('reporte-rendimiento.csv', columnasRendimiento, filasRendimiento)
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-mm-yellow px-4 py-2 text-xs font-bold text-mm-black transition-colors hover:bg-mm-yellow-dark"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-mm-gray-700 bg-mm-gray-800 px-4 py-12 text-sm text-mm-gray-300">
            <Loader2 className="h-5 w-5 animate-spin text-mm-yellow" />
            Cargando reporte...
          </div>
        ) : pestana === 'interacciones' ? (
          <TablaReporte
            columnas={columnasInteracciones}
            filas={filasInteracciones}
            vacio="No hay interacciones que coincidan con los filtros."
          />
        ) : pestana === 'aperturas' ? (
          <TablaReporte
            columnas={columnasAperturas}
            filas={filasAperturas}
            vacio="No hay aperturas que coincidan con los filtros."
          />
        ) : (
          <TablaReporte
            columnas={columnasRendimiento}
            filas={filasRendimiento}
            vacio="No hay concesionarios que coincidan con los filtros."
          />
        )}
      </section>
    </div>
  )
}

export default ReportesView
```

- [ ] **Paso 2: Modificar `src/App.tsx`**

1. Import lucide: cambia
```tsx
import { Bike, CalendarDays, LayoutDashboard, MapPin, type LucideIcon } from 'lucide-react'
```
por
```tsx
import { BarChart3, Bike, CalendarDays, LayoutDashboard, MapPin, type LucideIcon } from 'lucide-react'
```
2. Tras `import CronogramaExpansions from '@components/CronogramaExpansions'` añade:
```tsx
import ReportesView from '@components/ReportesView'
```
3. En `LINKS`, tras la entrada de `/expansiones` añade:
```tsx
  { to: '/reportes', etiqueta: 'Reportes', icono: BarChart3 },
```
4. En `<Routes>`, tras la ruta `/expansiones` añade:
```tsx
            <Route path="/reportes" element={<ReportesView />} />
```

- [ ] **Paso 3: Verificar type-check frontend**

Run (cwd `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: sin salida y exit code 0.

- [ ] **Paso 4: Commit**

```bash
git add packages/frontend/src/components/ReportesView.tsx packages/frontend/src/App.tsx
git commit -m "feat(frontend): vista de reportes avanzados con filtros, pestanas y exportacion CSV"
```

---

### Task 5: Verificación final, commit y push

**Archivos:** ninguno (solo verificaciones y entrega).

- [ ] **Paso 1: Verificar type-check backend**

Run (cwd `packages/backend`): `npx.cmd tsc --noEmit -p tsconfig.json`
Expected: sin salida y exit code 0.

- [ ] **Paso 2: Verificar build completo frontend (tsc + vite + purge-blue)**

Run (cwd raíz): `npm.cmd run build --workspace=@mundo-motos/frontend`
Expected: `✓ built in ...` y `[purge-blue] OK: ... CERO rastro de azul/cian y grises azulados en dist/.` con exit code 0.

> Si `purge-blue` fallara por un color por defecto de recharts (p. ej. algún gris azulado), sustituir ese color en la fuente (agregarlo a la paleta explícita de recharts) y re-verificar. No relajar el script.

- [ ] **Paso 3: Revisar el diff**

Run: `git status` y `git diff --stat`. Verificar que solo incluyen los archivos de las tareas 1–4.

- [ ] **Paso 4: Commit y push**

```bash
git add -A
git commit -m "feat: analitica gerencial 2026 (meta de expansion, pasteles y reportes avanzados)"
git push origin main
```

- [ ] **Paso 5: Confirmar estado remoto**

Run: `git log --oneline -5` y `git status`
Expected: commits locales presentes en `origin/main` y árbol de trabajo limpio.
