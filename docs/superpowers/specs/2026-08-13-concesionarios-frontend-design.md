# Design: Capa de UI y visualización de Concesionarios (Frontend)

Fecha: 2026-08-13
Estado: Aprobado

## Objetivo

Implementar en `packages/frontend` la capa de interfaz y visualización de concesionarios
conectada al backend real (`/api/v1/concesionarios`, Supabase-backed), con tipado estricto
de TypeScript, paleta corporativa de Mundo Motos (fondo oscuro, acentos `#FFCC00`) y **cero
errores de compilación** en el frontend.

## Decisiones tomadas

- **Conexión a la API**: URL directa vía `VITE_API_BASE_URL` con fallback a
  `http://localhost:3000/api/v1` (el backend tiene CORS habilitado para `http://localhost:5173`).
  En producción se define `VITE_API_BASE_URL` con la URL del backend en Render (aún no existe
  servicio desplegado; el MCP de Render no lista ninguno).
- **Montaje**: el `DashboardConcesionarios` reemplaza el placeholder "Dashboard - Próximamente"
  en la ruta `/` de `App.tsx`.
- **Estado operativo**: en el esquema real, `estado: 'activo' | 'inactivo'` ES el estado
  operativo (no existe campo separado). Los filtros soportados por el backend son
  `estado`, `ciudad`, `departamento`, `page`, `limit`.
- **"Código" del popup**: se muestra el campo `nit` (el esquema no tiene un campo `codigo`).

## Arquitectura

```
DashboardConcesionarios (App: ruta /)
  ├── Barra de filtros (estado, ciudad, limpiar) → concesionariosApi.getConcesionarios()
  ├── MapaConcesionarios (react-leaflet, markers divIcon amarillo, popups)
  └── Tabla/listado (fondo oscuro, badge de estado)
```

### Archivos

1. **`src/types/concesionario.ts`** (nuevo): tipos exactos del backend.
   - `EstadoOperativo = 'activo' | 'inactivo'`
   - `Concesionario` (snake_case): `id, nombre, razon_social, nit, email, telefono,
     ciudad, departamento, direccion, latitud, longitud, gerente_id, estado, metadatos,
     created_at, updated_at, deleted_at`
   - `CreateConcesionarioInput`, `UpdateConcesionarioInput` (parcial),
     `ConcesionarioFilters` (estado/ciudad/departamento/page/limit),
     `PaginatedConcesionarios` (`data, total, page, limit, hasMore`)
   - `src/types/index.ts`: eliminar el `Concesionario` camelCase obsoleto (sin uso) y
     re-exportar desde `./concesionario`. Mantener `ApiResponse<T>`, `PaginatedResponse<T>`.

2. **`src/services/api.ts`** (modificar, respetando la convención existente de clase `ApiService`):
   - `baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'`
   - Métodos tipados en `ApiService` + facade `concesionariosApi`:
     - `getConcesionarios(filters): Promise<ApiResponse<PaginatedConcesionarios>>`
     - `getConcesionarioById(id): Promise<ApiResponse<Concesionario>>`
     - `createConcesionario(data: CreateConcesionarioInput): Promise<ApiResponse<Concesionario>>`
     - `updateConcesionario(id, data: UpdateConcesionarioInput): Promise<ApiResponse<Concesionario>>`
   - Se conservan los interceptores existentes (auth token, manejo 401).

3. **`src/vite-env.d.ts`** (nuevo): `/// <reference types="vite/client" />` — fix preexistente
   que permite que `import.meta.env` compile.

4. **`src/components/MapaConcesionarios.tsx`** (nuevo):
   - `MapContainer` + `TileLayer` (OpenStreetMap) + `Marker` con `L.divIcon` amarillo
     corporativo (evita el problema de iconos por defecto de Leaflet con bundlers).
   - `Popup` con JSX/Tailwind: nombre (negrita), NIT como "código", badge de estado,
     dirección; acentos mm-yellow sobre fondo oscuro.
   - `fitBounds` automático a los markers; centro inicial Colombia (~4.71, -74.07).
   - Import de `leaflet/dist/leaflet.css`.

5. **`src/components/DashboardConcesionarios.tsx`** (nuevo):
   - Estado local (`useState` + `useEffect`) para fetch con filtros.
   - Estados visuales: loading (spinner), error (mensaje + reintentar), vacío, datos.
   - Filtros: `estado` (select), `ciudad` (texto) + botón "Limpiar filtros".
   - Layout oscuro (tarjetas `bg-mm-gray-900`/`mm-black`, acentos `mm-yellow`):
     tabla con Nombre / Código (NIT) / Ciudad / Departamento / Estado (badge) / Dirección.

6. **`src/App.tsx`** (modificar): render de `<DashboardConcesionarios />` en la ruta `/`.

7. **`vite.config.ts`** (fix): quitar `@radix-ui/react-dialog` y `@radix-ui/react-popover`
   del `manualChunks` (no son dependencias → rompen `vite build`). Se mantiene el chunk
   `leaflet`.

8. **`packages/frontend/.env.example`** (nuevo): documenta `VITE_API_BASE_URL`.

## Flujo de datos

1. `DashboardConcesionarios` monta y ejecuta `concesionariosApi.getConcesionarios({ estado?, ciudad? })`.
2. El resultado `{ success, data: { data, total, page, limit, hasMore } }` alimenta mapa y tabla.
3. Cambiar un filtro dispara un nuevo fetch; el error de la API se muestra con botón reintentar.

## Manejo de errores

- `apiService` ya devuelve `ApiResponse` con `success: false` y `error` (no lanza).
- El Dashboard verifica `success` y muestra el estado de error correspondiente.

## Verificación

- `npx.cmd tsc --noEmit` en `packages/frontend` → 0 errores.
- `npx.cmd vite build` → build exitoso.
- No se agregan dependencias (react-leaflet 4.2.1 y leaflet 1.9.4 ya instalados).
- No se modifica el backend.

## Fuera de alcance

- Formularios de crear/editar concesionario (los métodos de API quedan listos).
- Autenticación real (JWT) en el frontend.
- Persistencia de filtros en URL/estado global (zustand).
- Rutas adicionales (`/concesionarios`).
