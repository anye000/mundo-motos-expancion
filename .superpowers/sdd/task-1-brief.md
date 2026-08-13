# Task 1: Tipos de Concesionario

**Files:**
- Create: `packages/frontend/src/types/concesionario.ts`
- Modify: `packages/frontend/src/types/index.ts` (quitar `Concesionario` camelCase obsoleto, re-exportar desde `./concesionario`)

**Interfaces:**
- Produces (lo que usan Task 2-5, importado como `@types/concesionario`): `EstadoOperativo`, `Concesionario`, `CreateConcesionarioInput`, `UpdateConcesionarioInput`, `ConcesionarioFilters`, `PaginatedConcesionarios`.

## Step 1: Crear `src/types/concesionario.ts`

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

## Step 2: Actualizar `src/types/index.ts`

Reemplazar el bloque `Concesionario` camelCase (líneas 18-35) por el re-export y añadir el re-export al final del archivo:

```ts
export type { Concesionario, ConcesionarioFilters, CreateConcesionarioInput, UpdateConcesionarioInput, PaginatedConcesionarios, EstadoOperativo } from './concesionario'
```

El archivo queda: `UUID`, `User`, `Ubicacion`, `CRMContact`, `ApiResponse`, `PaginatedResponse` y el `export type {...} from './concesionario'`.

## Step 3: Verificar compilación

Run (desde `packages/frontend`): `npx.cmd tsc --noEmit`
Expected: EXIT=0 (si ya falla por `import.meta.env` de `api.ts`, es preexistente y se resuelve en Task 2).

## Step 4: Commit

```bash
git add packages/frontend/src/types/concesionario.ts packages/frontend/src/types/index.ts
git commit -m "feat(frontend): tipos de Concesionario alineados con el backend"
```

## Global Constraints (relevantes a esta tarea)

- El repo está en una rama feature (`feat/frontend-concesionarios`). Hay cambios sin commitear de otros trabajos (backend) — NO los toques ni los commitees; agrega al commit SOLO los archivos de esta tarea.
- PowerShell: usar `npm.cmd`/`npx.cmd`, nunca `npm`/`npx` (scripts .ps1 bloqueados). Ejecutar desde el directorio correcto.
- Estilo: `types/concesionario.ts` nuevo con punto y coma (Prettier). `types/index.ts` existente conserva su estilo local sin punto y coma (diffs mínimos).
- No hay suite de tests en el repo; la verificación es `npx.cmd tsc --noEmit`.
