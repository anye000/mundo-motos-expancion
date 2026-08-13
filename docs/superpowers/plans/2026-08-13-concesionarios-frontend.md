# Capa de UI de Concesionarios (Frontend) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la capa de interfaz y visualización de concesionarios en `packages/frontend` (tipos, cliente API tipado, mapa Leaflet, dashboard con filtros y tabla) con cero errores de compilación TypeScript y paleta corporativa Mundo Motos.

**Architecture:** DashboardConcesionarios (montado en `/`) orquesta el fetch con filtros y alimenta dos vistas: MapaConcesionarios (react-leaflet) y una tabla oscura. El cliente HTTP reutiliza la clase `ApiService` existente (axios) apuntando a `VITE_API_BASE_URL || http://localhost:3000/api/v1`. Los tipos viven en `types/concesionario.ts` (snake_case, espejo exacto del backend).

**Tech Stack:** React 18, TypeScript 5, Tailwind CSS 3, react-leaflet 4.2.1, leaflet 1.9.4, axios 1.6, Vite 5.

## Global Constraints

- **No agregar dependencias**: react-leaflet 4.2.1 y leaflet 1.9.4 ya están instalados. No instalar nada nuevo.
- **Campos del backend (snake_case, fuente de verdad)**: `id, nombre, razon_social, nit, email, telefono, ciudad, departamento, direccion, latitud, longitud, gerente_id, estado ('activo'|'inactivo'), metadatos, created_at, updated_at, deleted_at`.
- **Envelope del backend**: lista → `{ success, data: { data, total, page, limit, hasMore } }`; item → `{ success, data, message }`; error → `{ success: false, error, code? }`. `apiService` **no lanza**: devuelve `ApiResponse` con `success: false` en errores.
- **"Código" = `nit`** (el esquema no tiene campo `codigo`). **"Estado operativo" = `estado`**.
- **No hay suite de tests** en el repo (vitest instalado, cero archivos de test). La verificación de cada tarea es `npx.cmd tsc --noEmit` y al final `npx.cmd vite build`. Ejecutar siempre desde `packages/frontend`.
- **PowerShell**: usar `npm.cmd`/`npx.cmd`, nunca `npm`/`npx` (scripts .ps1 bloqueados).
- **Estilo por archivo**: los archivos nuevos se escriben con punto y coma (estilo Prettier). Los archivos existentes que se modifican (`api.ts`, `types/index.ts`, `App.tsx`) conservan su estilo local **sin punto y coma** para diffs mínimos.
- **Paleta**: `mm-black`, `mm-yellow` (#FFCC00), `mm-gray-50..900`, `mm-success`/`mm-error`. El dashboard usa fondo oscuro (`mm-gray-900`/`mm-black`) con acentos amarillos.
- **No modificar el backend.**

---

### Task 1: Tipos de Concesionario

**Files:**
- Create: `packages/frontend/src/types/concesionario.ts`
- Modify: `packages/frontend/src/types/index.ts` (quitar `Concesionario` camelCase obsoleto, re-exportar desde `./concesionario`)

**Interfaces:**
- Produces (lo que usan Task 2-5, importado como `@types/concesionario`): `EstadoOperativo`, `Concesionario`, `CreateConcesionarioInput`, `UpdateConcesionarioInput`, `ConcesionarioFilters`, `PaginatedConcesionarios`.

- [ ] **Step 1: Crear `src/types/concesionario.ts`**

```ts
/** Tipos del módulo Concesionarios alineados con el backend (snake_case). */

export type EstadoOperativo = 'activo' | 'inactivo';

export interface Concesionario {
  id: string;
  nombre: string;
  razon_social: string;
  nit: string;
  email: string;
  telefono: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id: string | null;
  estado: EstadoOperativo;
  metadatos: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateConcesionarioInput {
  nombre: string;
  razon_social: string;
  nit: string;
  email: string;
  telefono?: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  metadatos?: Record<string, unknown> | null;
}

export interface UpdateConcesionarioInput {
  nombre?: string;
  razon_social?: string;
  nit?: string;
  email?: string;
  telefono?: string | null;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  metadatos?: Record<string, unknown> | null;
}

export interface ConcesionarioFilters {
  estado?: EstadoOperativo;
  ciudad?: string;
  departamento?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedConcesionarios {
  data: Concesionario[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

- [ ] **Step 2: Actualizar `src/types/index.ts`**

Reemplazar el bloque `Concesionario` camelCase (líneas 18-35) por el re-export y añadir el re-export al final del archivo:

```ts
export type { Concesionario, ConcesionarioFilters, CreateConcesionarioInput, UpdateConcesionarioInput, PaginatedConcesionarios, EstadoOperativo } from './concesionario'
```

El archivo queda: `UUID`, `User`, `Ubicacion`, `CRMContact`, `ApiResponse`, `PaginatedResponse` y el `export type {...} from './concesionario'`.

- [ ] **Step 3: Verificar compilación**

Run (desde `packages/frontend`): `npx.cmd tsc --noEmit`
Expected: EXIT=0 (si ya falla por `import.meta.env` de `api.ts`, es preexistente y se resuelve en Task 2).

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/types/concesionario.ts packages/frontend/src/types/index.ts
git commit -m "feat(frontend): tipos de Concesionario alineados con el backend"
```

---

### Task 2: Cliente API tipado + fix de compilación base

**Files:**
- Create: `packages/frontend/src/vite-env.d.ts`
- Modify: `packages/frontend/src/services/api.ts`

**Interfaces:**
- Consumes: `Concesionario`, `CreateConcesionarioInput`, `UpdateConcesionarioInput`, `ConcesionarioFilters`, `PaginatedConcesionarios` de `@types/concesionario` (Task 1); `ApiResponse` de `@types/index`.
- Produces: `concesionariosApi` (facade) con `getConcesionarios(filters?)`, `getConcesionarioById(id)`, `createConcesionario(data)`, `updateConcesionario(id, data)`. Lo consume Task 4.

- [ ] **Step 1: Crear `src/vite-env.d.ts`** (fix preexistente: `import.meta.env` no compilaba)

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 2: Modificar `src/services/api.ts`**

- Línea 2: importar los tipos nuevos.
- Línea 7: `baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'`.
- Añadir los 4 métodos dentro de la clase `ApiService` (después del método `delete`), respetando el estilo local **sin punto y coma**.
- Añadir el facade `concesionariosApi` tras el `export const apiService`.

Import nuevo:

```ts
import {
  Concesionario,
  ConcesionarioFilters,
  CreateConcesionarioInput,
  UpdateConcesionarioInput,
  PaginatedConcesionarios,
} from '@types/concesionario'
```

Constructor (solo cambia la línea de `baseURL`):

```ts
  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') {
```

Métodos de clase (después de `delete<T>`):

```ts
  async getConcesionarios(filters: ConcesionarioFilters = {}): Promise<ApiResponse<PaginatedConcesionarios>> {
    return this.get<PaginatedConcesionarios>('/concesionarios', { params: filters })
  }

  async getConcesionarioById(id: string): Promise<ApiResponse<Concesionario>> {
    return this.get<Concesionario>(`/concesionarios/${id}`)
  }

  async createConcesionario(data: CreateConcesionarioInput): Promise<ApiResponse<Concesionario>> {
    return this.post<Concesionario>('/concesionarios', data)
  }

  async updateConcesionario(id: string, data: UpdateConcesionarioInput): Promise<ApiResponse<Concesionario>> {
    return this.put<Concesionario>(`/concesionarios/${id}`, data)
  }
```

Facade (al final del archivo):

```ts
export const concesionariosApi = {
  getConcesionarios: (filters?: ConcesionarioFilters) => apiService.getConcesionarios(filters),
  getConcesionarioById: (id: string) => apiService.getConcesionarioById(id),
  createConcesionario: (data: CreateConcesionarioInput) => apiService.createConcesionario(data),
  updateConcesionario: (id: string, data: UpdateConcesionarioInput) => apiService.updateConcesionario(id, data),
}
```

- [ ] **Step 3: Verificar compilación**

Run (desde `packages/frontend`): `npx.cmd tsc --noEmit`
Expected: EXIT=0. Si `tsc` reporta otros errores preexistentes (p. ej. imports sin usar en archivos existentes), corregirlos en el mismo archivo en que aparezcan para que la tarea quede en verde.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/vite-env.d.ts packages/frontend/src/services/api.ts
git commit -m "feat(frontend): cliente API tipado para concesionarios + fix vite-env.d.ts"
```

---

### Task 3: MapaConcesionarios (react-leaflet)

**Files:**
- Create: `packages/frontend/src/components/MapaConcesionarios.tsx`
- Modify: `packages/frontend/src/styles/index.css` (estilos corporativos del popup de Leaflet)

**Interfaces:**
- Consumes: `Concesionario`, `EstadoOperativo` de `@types/concesionario` (Task 1).
- Produces: componente por defecto `MapaConcesionarios({ concesionarios }: { concesionarios: Concesionario[] })`. Lo consume Task 4.

- [ ] **Step 1: Crear `src/components/MapaConcesionarios.tsx`**

```tsx
import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Concesionario, EstadoOperativo } from '@types/concesionario'

const CENTRO_INICIAL: [number, number] = [4.711, -74.072]
const ZOOM_INICIAL = 5

const pinIcon = L.divIcon({
  className: '',
  html: `
    <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;
      background:#FFCC00;border:2px solid #000;transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
})

const ESTADO_UI: Record<EstadoOperativo, { texto: string; clase: string }> = {
  activo: {
    texto: 'Activo',
    clase: 'border-mm-success/40 bg-mm-success/20 text-mm-success',
  },
  inactivo: {
    texto: 'Inactivo',
    clase: 'border-mm-error/40 bg-mm-error/20 text-mm-error',
  },
}

function FitBounds({ concesionarios }: { concesionarios: Concesionario[] }) {
  const map = useMap()

  useEffect(() => {
    if (concesionarios.length === 0) return
    const bounds = L.latLngBounds(
      concesionarios.map((c) => [c.latitud, c.longitud] as [number, number])
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [concesionarios, map])

  return null
}

interface MapaConcesionariosProps {
  concesionarios: Concesionario[]
}

export default function MapaConcesionarios({ concesionarios }: MapaConcesionariosProps) {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-lg border border-mm-gray-800">
      <MapContainer center={CENTRO_INICIAL} zoom={ZOOM_INICIAL} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds concesionarios={concesionarios} />
        {concesionarios.map((c) => (
          <Marker key={c.id} position={[c.latitud, c.longitud]} icon={pinIcon}>
            <Popup>
              <div className="min-w-[180px]">
                <div className="text-sm font-bold text-mm-yellow">{c.nombre}</div>
                <div className="mt-1 text-xs text-mm-gray-400">
                  Código: <span className="font-medium text-mm-gray-100">{c.nit}</span>
                </div>
                <div className="mt-1 text-xs text-mm-gray-400">
                  {c.ciudad}, {c.departamento}
                </div>
                <div className="mt-1 text-xs text-mm-gray-400">{c.direccion}</div>
                <span
                  className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ESTADO_UI[c.estado].clase}`}
                >
                  {ESTADO_UI[c.estado].texto}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
```

- [ ] **Step 2: Añadir estilos corporativos de Leaflet a `src/styles/index.css`** (al final del archivo)

```css
/* Popup Leaflet con estilo corporativo */
.leaflet-popup-content-wrapper {
  border: 1px solid #FFCC00;
  border-radius: 0.5rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
  background: #111827;
  color: #f3f4f6;
}

.leaflet-container {
  font-family: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 3: Verificar compilación**

Run (desde `packages/frontend`): `npx.cmd tsc --noEmit`
Expected: EXIT=0.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/MapaConcesionarios.tsx packages/frontend/src/styles/index.css
git commit -m "feat(frontend): mapa de concesionarios con react-leaflet y popups corporativos"
```

---

### Task 4: DashboardConcesionarios

**Files:**
- Create: `packages/frontend/src/components/DashboardConcesionarios.tsx`

**Interfaces:**
- Consumes: `concesionariosApi` de `@services/api` (Task 2); `MapaConcesionarios` de `@components/MapaConcesionarios` (Task 3); tipos de `@types/concesionario` (Task 1).
- Produces: componente por defecto `DashboardConcesionarios`. Lo consume Task 5.

- [ ] **Step 1: Crear `src/components/DashboardConcesionarios.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { concesionariosApi } from '@services/api'
import { Concesionario, ConcesionarioFilters, EstadoOperativo } from '@types/concesionario'
import MapaConcesionarios from '@components/MapaConcesionarios'

const ESTADOS: EstadoOperativo[] = ['activo', 'inactivo']

interface EstadoVista {
  data: Concesionario[]
  loading: boolean
  error: string | null
}

const estadoInicial: EstadoVista = { data: [], loading: true, error: null }

function etiquetaEstado(estado: EstadoOperativo): string {
  return estado === 'activo' ? 'Activo' : 'Inactivo'
}

function claseEstado(estado: EstadoOperativo): string {
  return estado === 'activo'
    ? 'border-mm-success/40 bg-mm-success/20 text-mm-success'
    : 'border-mm-error/40 bg-mm-error/20 text-mm-error'
}

export default function DashboardConcesionarios() {
  const [estado, setEstado] = useState<EstadoOperativo | ''>('')
  const [ciudad, setCiudad] = useState('')
  const [vista, setVista] = useState<EstadoVista>(estadoInicial)

  const cargar = useCallback(async () => {
    setVista((v) => ({ ...v, loading: true, error: null }))
    const filters: ConcesionarioFilters = {
      estado: estado || undefined,
      ciudad: ciudad.trim() || undefined,
      limit: 100,
    }
    const response = await concesionariosApi.getConcesionarios(filters)
    if (response.success && response.data) {
      setVista({ data: response.data.data, loading: false, error: null })
    } else {
      setVista({
        data: [],
        loading: false,
        error: response.error || 'Error al cargar los concesionarios',
      })
    }
  }, [estado, ciudad])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const limpiarFiltros = () => {
    setEstado('')
    setCiudad('')
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-mm-gray-800 bg-mm-gray-900 p-4 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm font-medium text-mm-gray-300">
          Estado operativo
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoOperativo | '')}
            className="input-field bg-mm-gray-800 text-mm-gray-100"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {etiquetaEstado(e)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-mm-gray-300">
          Ciudad
          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ej: Bogotá"
            className="input-field bg-mm-gray-800 text-mm-gray-100"
          />
        </label>

        <button onClick={limpiarFiltros} className="btn-secondary">
          Limpiar filtros
        </button>
      </section>

      <MapaConcesionarios concesionarios={vista.data} />

      <section className="overflow-hidden rounded-lg border border-mm-gray-800 bg-mm-gray-900">
        <header className="flex items-center justify-between border-b border-mm-gray-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-mm-yellow">Concesionarios</h2>
          <span className="text-sm text-mm-gray-400">{vista.data.length} registros</span>
        </header>

        {vista.loading && (
          <div className="flex items-center justify-center p-10">
            <div className="loader" />
          </div>
        )}

        {!vista.loading && vista.error && (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-mm-error">{vista.error}</p>
            <button onClick={() => void cargar()} className="btn-secondary">
              Reintentar
            </button>
          </div>
        )}

        {!vista.loading && !vista.error && vista.data.length === 0 && (
          <div className="p-10 text-center text-sm text-mm-gray-400">
            No hay concesionarios con los filtros seleccionados.
          </div>
        )}

        {!vista.loading && !vista.error && vista.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-mm-gray-800 text-xs uppercase tracking-wider text-mm-gray-400">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Código (NIT)</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Departamento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mm-gray-800">
                {vista.data.map((c) => (
                  <tr key={c.id} className="bg-mm-gray-900 text-mm-gray-200 hover:bg-mm-gray-800">
                    <td className="px-4 py-3 font-medium text-mm-yellow">{c.nombre}</td>
                    <td className="px-4 py-3">{c.nit}</td>
                    <td className="px-4 py-3">{c.ciudad}</td>
                    <td className="px-4 py-3">{c.departamento}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${claseEstado(c.estado)}`}
                      >
                        {etiquetaEstado(c.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.direccion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

Run (desde `packages/frontend`): `npx.cmd tsc --noEmit`
Expected: EXIT=0.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/components/DashboardConcesionarios.tsx
git commit -m "feat(frontend): dashboard de concesionarios con filtros, mapa y tabla"
```

---

### Task 5: Wiring, config y verificación final

**Files:**
- Modify: `packages/frontend/src/App.tsx` (montar Dashboard en `/`)
- Modify: `packages/frontend/vite.config.ts` (quitar `@radix-ui/*` del `manualChunks`)
- Create: `packages/frontend/.env.example`

**Interfaces:**
- Consumes: `DashboardConcesionarios` de `@components/DashboardConcesionarios` (Task 4).

- [ ] **Step 1: Montar el Dashboard en `App.tsx`**

Añadir el import tras la línea 2:

```tsx
import DashboardConcesionarios from '@components/DashboardConcesionarios'
```

Reemplazar la línea 17 (placeholder) por:

```tsx
<Route path="/" element={<DashboardConcesionarios />} />
```

- [ ] **Step 2: Corregir `vite.config.ts` `manualChunks`** (referencia `@radix-ui/*` no instalado → build falla)

Reemplazar el bloque `manualChunks` (líneas 129-134) por:

```ts
        manualChunks: {
          react: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
        },
```

- [ ] **Step 3: Crear `packages/frontend/.env.example`**

```
# URL base de la API del backend.
# Desarrollo: backend local (CORS habilitado para http://localhost:5173).
# Producción (Render): https://<tu-api>.onrender.com/api/v1
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

- [ ] **Step 4: Verificación final — type-check y build**

Run (desde `packages/frontend`):
1. `npx.cmd tsc --noEmit` → Expected: EXIT=0
2. `npx.cmd vite build` → Expected: build exitoso (puede emitir warnings por assets PWA faltantes; no son errores)

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/App.tsx packages/frontend/vite.config.ts packages/frontend/.env.example
git commit -m "feat(frontend): montar dashboard de concesionarios y fixes de build"
```

---

## Self-Review

**Cobertura del spec:**
- Tipos exactos del backend → Task 1 ✔
- Cliente HTTP tipado con 4 métodos y `VITE_API_BASE_URL` → Task 2 ✔
- Mapa con markers, popups (nombre/NIT/estado/dirección), estilo corporativo → Task 3 ✔
- Dashboard con filtros, mapa y tabla, paleta oscura + mm-yellow → Task 4 ✔
- Wiring en `/` → Task 5 ✔
- Zero errores de compilación (fix `vite-env.d.ts`, `manualChunks`) → Task 2 y Task 5 ✔
- `.env.example` producción → Task 5 ✔

**Placeholders:** ninguno; todos los pasos incluyen código completo y comandos con resultado esperado.

**Consistencia de tipos:** `Concesionario`, `ConcesionarioFilters`, `PaginatedConcesionarios` y `EstadoOperativo` se definen en Task 1 y se usan con la misma forma en Tasks 2-4. `concesionariosApi.getConcesionarios(filters?)` → `ApiResponse<PaginatedConcesionarios>`; el Dashboard accede a `response.data.data`. `MapaConcesionarios` recibe `concesionarios: Concesionario[]`. Coherente en todo el plan.
