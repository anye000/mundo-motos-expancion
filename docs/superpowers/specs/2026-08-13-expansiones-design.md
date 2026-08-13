# Design: Módulo de Reportes y Proyecciones de Expansión

Fecha: 2026-08-13
Estado: Aprobado

## Objetivo

Implementar el módulo de Reportes y Proyecciones de Expansión para el CRM de
Mundo Motos: tabla + semilla en Supabase, módulo backend completo (CRUD) en
`/api/v1/expansiones`, y cronograma en calendario mensual en el frontend,
integrado como pestaña junto al mapa y listado de concesionarios. Todo con la
paleta corporativa (fondos oscuros, acento `#FFCC00`) y type-check/build limpios.

## Decisiones tomadas

- **Datos reales en backend**: migración `002_expansiones.sql` con la tabla
  `expansiones` y datos semilla (agosto/septiembre 2026: Táchira, La California,
  2 Caminos, Maturín, Maracaibo + Valencia como ejemplo completado).
- **CRUD completo** en el endpoint `/api/v1/expansiones`, siguiendo el patrón
  modular `concesionario.{model,service,controller,routes}.ts`.
- **Calendario mensual** en el frontend con navegación por mes, marcadores por
  locación, tarjetas resumen por estado, cuenta regresiva y listado con barras
  de avance.
- **Integración por pestañas** en `DashboardConcesionarios.tsx`:
  "Concesionarios" (vista actual) y "Cronograma de Expansión".
- **Estado de avance**: campo `estado` (`'proximo' | 'en_ejecucion' | 'completado'`)
  + `avance` SMALLINT 0–100 para la barra de progreso.
- Coordenadas opcionales (`latitud`, `longitud`) para una futura integración
  con el mapa.

## Arquitectura

### Base de datos — tabla `expansiones`

```sql
CREATE TABLE expansiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario VARCHAR(255) NOT NULL,
  locacion VARCHAR(255) NOT NULL,
  fecha_apertura DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'proximo'
    CHECK (estado IN ('proximo', 'en_ejecucion', 'completado')),
  avance SMALLINT NOT NULL DEFAULT 0 CHECK (avance BETWEEN 0 AND 100),
  latitud DECIMAL(10,8),
  longitud DECIMAL(11,8),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

Semilla (fechas agosto 2026, ajustables): La California (2026-08-20,
en_ejecucion 60), 2 Caminos (2026-08-28, proximo 20), Táchira (2026-09-04,
proximo 10), Maturín (2026-09-18, proximo 5), Maracaibo (2026-09-30, proximo 0),
Valencia (2026-06-20, completado 100).

### Backend — `/api/v1/expansiones`

Archivos bajo `packages/backend/src/modules/expansiones/`:
`expansion.model.ts`, `expansion.service.ts`, `expansion.controller.ts`,
`expansion.routes.ts`, `index.ts`. Reutiliza `ApiError`, `mapSupabaseError`
(errors 23505/23503/22P02), `sendSuccess`/`sendPaginated` y las validaciones del
módulo `concesionarios`.

- `GET /` — filtros `estado`, `locacion` (ilike), `fecha_desde`, `fecha_hasta`,
  `page`, `limit`; orden por `fecha_apertura`; excluye `deleted_at`.
- `GET /:id` — detalle (404 si no existe).
- `POST /` — valida `concesionario`, `locacion`, `fecha_apertura`; `estado` por
  defecto `proximo`, `avance` por defecto 0.
- `PUT /:id` — actualización parcial validada.
- `DELETE /:id` — soft delete (`deleted_at = now()`).

Montaje en `src/index.ts` (`app.use('/api/v1/expansiones', expansionesRouter)`)
y actualización del listado de endpoints del placeholder de `/api/v1`.

### Frontend

1. **`src/types/expansion.ts`**: `EstadoExpansion`, `Expansion`, `CreateExpansionInput`,
   `UpdateExpansionInput`, `ExpansionFilters`, `PaginatedExpansiones` (snake_case).
   Re-export desde `src/types/index.ts`.
2. **`src/services/api.ts`**: `getExpansiones`, `getExpansionById`, `createExpansion`,
   `updateExpansion`, `deleteExpansion` siguiendo el patrón de `getConcesionarios`.
3. **`src/hooks/useExpansiones.ts`**: lista + filtros + `recargar` + `eliminar`,
   patrón `useConcesionarios`.
4. **`src/components/CronogramaExpansions.tsx`**:
   - Cabecera con mes en español, navegación ◀/▶ y botón "Hoy" (date-fns, semana
     iniciando lunes).
   - Tarjetas resumen: Próximas / En ejecución / Completadas.
   - Cuadrícula mensual con chips por locación coloreados por estado y día actual
     resaltado con `mm-yellow`.
   - Badge de cuenta regresiva: "hoy", "en X días", "hace X días".
   - Listado del mes visible con barra de `avance` y observaciones.
5. **`src/components/DashboardConcesionarios.tsx`**: pestañas "Concesionarios" y
   "Cronograma de Expansión", con acento amarillo en la activa.

## Flujo de datos

1. `DashboardConcesionarios` monta la pestaña de expansión → `CronogramaExpansions`
   consume `useExpansiones()`.
2. El hook llama `apiService.getExpansiones()` y expone datos/estados.
3. La cuenta regresiva se calcula en el cliente contra `fecha_apertura`.

## Manejo de errores

- `apiService` devuelve `ApiResponse` con `success:false` + `error`.
- El hook expone `error` y `recargar`; el calendario muestra estados de
  carga/vacío/error con reintento.

## Verificación

- Backend: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`.
- Frontend: `npm.cmd run type-check --workspace=@mundo-motos/frontend` y
  `npm.cmd run build --workspace=@mundo-motos/frontend`.
- Migración aplicada a Supabase (proyecto a confirmar) + advisors de seguridad.

## Fuera de alcance

- Formularios de crear/editar apertura en la UI (el CRUD del backend queda listo).
- Mapas de expansión (las coordenadas se guardan pero no se dibujan).
- Autenticación real.
