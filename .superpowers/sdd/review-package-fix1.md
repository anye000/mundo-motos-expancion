# Review package: 23e3e7e..HEAD (fix round 1)

## git log --oneline 23e3e7e..HEAD

48126e7 fix(frontend): corregir ruta de la API y mensajes de error en espa├▒ol
899d06a docs: design del m├│dulo de expansiones (backend + calendario frontend)

## git diff --stat 23e3e7e HEAD

 .../specs/2026-08-13-expansiones-design.md         | 121 +++++++++++++++++++++
 packages/frontend/src/services/api.ts              |  73 +++++++++++--
 2 files changed, 185 insertions(+), 9 deletions(-)

## git diff -U10 23e3e7e HEAD

diff --git a/docs/superpowers/specs/2026-08-13-expansiones-design.md b/docs/superpowers/specs/2026-08-13-expansiones-design.md
new file mode 100644
index 0000000..9a49012
--- /dev/null
+++ b/docs/superpowers/specs/2026-08-13-expansiones-design.md
@@ -0,0 +1,121 @@
+# Design: M├│dulo de Reportes y Proyecciones de Expansi├│n
+
+Fecha: 2026-08-13
+Estado: Aprobado
+
+## Objetivo
+
+Implementar el m├│dulo de Reportes y Proyecciones de Expansi├│n para el CRM de
+Mundo Motos: tabla + semilla en Supabase, m├│dulo backend completo (CRUD) en
+`/api/v1/expansiones`, y cronograma en calendario mensual en el frontend,
+integrado como pesta├▒a junto al mapa y listado de concesionarios. Todo con la
+paleta corporativa (fondos oscuros, acento `#FFCC00`) y type-check/build limpios.
+
+## Decisiones tomadas
+
+- **Datos reales en backend**: migraci├│n `002_expansiones.sql` con la tabla
+  `expansiones` y datos semilla (agosto/septiembre 2026: T├íchira, La California,
+  2 Caminos, Matur├¡n, Maracaibo + Valencia como ejemplo completado).
+- **CRUD completo** en el endpoint `/api/v1/expansiones`, siguiendo el patr├│n
+  modular `concesionario.{model,service,controller,routes}.ts`.
+- **Calendario mensual** en el frontend con navegaci├│n por mes, marcadores por
+  locaci├│n, tarjetas resumen por estado, cuenta regresiva y listado con barras
+  de avance.
+- **Integraci├│n por pesta├▒as** en `DashboardConcesionarios.tsx`:
+  "Concesionarios" (vista actual) y "Cronograma de Expansi├│n".
+- **Estado de avance**: campo `estado` (`'proximo' | 'en_ejecucion' | 'completado'`)
+  + `avance` SMALLINT 0ÔÇô100 para la barra de progreso.
+- Coordenadas opcionales (`latitud`, `longitud`) para una futura integraci├│n
+  con el mapa.
+
+## Arquitectura
+
+### Base de datos ÔÇö tabla `expansiones`
+
+```sql
+CREATE TABLE expansiones (
+  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
+  concesionario VARCHAR(255) NOT NULL,
+  locacion VARCHAR(255) NOT NULL,
+  fecha_apertura DATE NOT NULL,
+  estado VARCHAR(20) NOT NULL DEFAULT 'proximo'
+    CHECK (estado IN ('proximo', 'en_ejecucion', 'completado')),
+  avance SMALLINT NOT NULL DEFAULT 0 CHECK (avance BETWEEN 0 AND 100),
+  latitud DECIMAL(10,8),
+  longitud DECIMAL(11,8),
+  observaciones TEXT,
+  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
+  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
+  deleted_at TIMESTAMP WITH TIME ZONE
+);
+```
+
+Semilla (fechas agosto 2026, ajustables): La California (2026-08-20,
+en_ejecucion 60), 2 Caminos (2026-08-28, proximo 20), T├íchira (2026-09-04,
+proximo 10), Matur├¡n (2026-09-18, proximo 5), Maracaibo (2026-09-30, proximo 0),
+Valencia (2026-06-20, completado 100).
+
+### Backend ÔÇö `/api/v1/expansiones`
+
+Archivos bajo `packages/backend/src/modules/expansiones/`:
+`expansion.model.ts`, `expansion.service.ts`, `expansion.controller.ts`,
+`expansion.routes.ts`, `index.ts`. Reutiliza `ApiError`, `mapSupabaseError`
+(errors 23505/23503/22P02), `sendSuccess`/`sendPaginated` y las validaciones del
+m├│dulo `concesionarios`.
+
+- `GET /` ÔÇö filtros `estado`, `locacion` (ilike), `fecha_desde`, `fecha_hasta`,
+  `page`, `limit`; orden por `fecha_apertura`; excluye `deleted_at`.
+- `GET /:id` ÔÇö detalle (404 si no existe).
+- `POST /` ÔÇö valida `concesionario`, `locacion`, `fecha_apertura`; `estado` por
+  defecto `proximo`, `avance` por defecto 0.
+- `PUT /:id` ÔÇö actualizaci├│n parcial validada.
+- `DELETE /:id` ÔÇö soft delete (`deleted_at = now()`).
+
+Montaje en `src/index.ts` (`app.use('/api/v1/expansiones', expansionesRouter)`)
+y actualizaci├│n del listado de endpoints del placeholder de `/api/v1`.
+
+### Frontend
+
+1. **`src/types/expansion.ts`**: `EstadoExpansion`, `Expansion`, `CreateExpansionInput`,
+   `UpdateExpansionInput`, `ExpansionFilters`, `PaginatedExpansiones` (snake_case).
+   Re-export desde `src/types/index.ts`.
+2. **`src/services/api.ts`**: `getExpansiones`, `getExpansionById`, `createExpansion`,
+   `updateExpansion`, `deleteExpansion` siguiendo el patr├│n de `getConcesionarios`.
+3. **`src/hooks/useExpansiones.ts`**: lista + filtros + `recargar` + `eliminar`,
+   patr├│n `useConcesionarios`.
+4. **`src/components/CronogramaExpansions.tsx`**:
+   - Cabecera con mes en espa├▒ol, navegaci├│n ÔùÇ/ÔûÂ y bot├│n "Hoy" (date-fns, semana
+     iniciando lunes).
+   - Tarjetas resumen: Pr├│ximas / En ejecuci├│n / Completadas.
+   - Cuadr├¡cula mensual con chips por locaci├│n coloreados por estado y d├¡a actual
+     resaltado con `mm-yellow`.
+   - Badge de cuenta regresiva: "hoy", "en X d├¡as", "hace X d├¡as".
+   - Listado del mes visible con barra de `avance` y observaciones.
+5. **`src/components/DashboardConcesionarios.tsx`**: pesta├▒as "Concesionarios" y
+   "Cronograma de Expansi├│n", con acento amarillo en la activa.
+
+## Flujo de datos
+
+1. `DashboardConcesionarios` monta la pesta├▒a de expansi├│n ÔåÆ `CronogramaExpansions`
+   consume `useExpansiones()`.
+2. El hook llama `apiService.getExpansiones()` y expone datos/estados.
+3. La cuenta regresiva se calcula en el cliente contra `fecha_apertura`.
+
+## Manejo de errores
+
+- `apiService` devuelve `ApiResponse` con `success:false` + `error`.
+- El hook expone `error` y `recargar`; el calendario muestra estados de
+  carga/vac├¡o/error con reintento.
+
+## Verificaci├│n
+
+- Backend: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`.
+- Frontend: `npm.cmd run type-check --workspace=@mundo-motos/frontend` y
+  `npm.cmd run build --workspace=@mundo-motos/frontend`.
+- Migraci├│n aplicada a Supabase (proyecto a confirmar) + advisors de seguridad.
+
+## Fuera de alcance
+
+- Formularios de crear/editar apertura en la UI (el CRUD del backend queda listo).
+- Mapas de expansi├│n (las coordenadas se guardan pero no se dibujan).
+- Autenticaci├│n real.
diff --git a/packages/frontend/src/services/api.ts b/packages/frontend/src/services/api.ts
index 6271d28..72c9f17 100644
--- a/packages/frontend/src/services/api.ts
+++ b/packages/frontend/src/services/api.ts
@@ -1,18 +1,20 @@
 import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
 import { ApiResponse, PaginatedResponse } from '../types/index'
 import {
   Concesionario,
   ConcesionarioFilters,
   CreateConcesionarioInput,
   UpdateConcesionarioInput,
 } from '../types/concesionario'
+import { InteraccionCrm, CreateInteraccionInput } from '../types/interaccion'
+import { Usuario } from '../types/usuario'
 
 class ApiService {
   private client: AxiosInstance
 
   constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') {
     this.client = axios.create({
       baseURL,
       headers: {
         'Content-Type': 'application/json',
       },
@@ -44,107 +46,160 @@ class ApiService {
     )
   }
 
   async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
     try {
       const response = await this.client.get<ApiResponse<T>>(url, config)
       return response.data
     } catch (error: any) {
       return {
         success: false,
-        error: error.response?.data?.error || error.message,
+        error:
+          error.response?.data?.error ||
+          (error.response
+            ? `Error del servidor (${error.response.status})`
+            : 'Error de conexi├│n con el servidor'),
       }
     }
   }
 
   async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
     try {
       const response = await this.client.post<ApiResponse<T>>(url, data, config)
       return response.data
     } catch (error: any) {
       return {
         success: false,
-        error: error.response?.data?.error || error.message,
+        error:
+          error.response?.data?.error ||
+          (error.response
+            ? `Error del servidor (${error.response.status})`
+            : 'Error de conexi├│n con el servidor'),
       }
     }
   }
 
   async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
     try {
       const response = await this.client.put<ApiResponse<T>>(url, data, config)
       return response.data
     } catch (error: any) {
       return {
         success: false,
-        error: error.response?.data?.error || error.message,
+        error:
+          error.response?.data?.error ||
+          (error.response
+            ? `Error del servidor (${error.response.status})`
+            : 'Error de conexi├│n con el servidor'),
       }
     }
   }
 
   async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
     try {
       const response = await this.client.patch<ApiResponse<T>>(url, data, config)
       return response.data
     } catch (error: any) {
       return {
         success: false,
-        error: error.response?.data?.error || error.message,
+        error:
+          error.response?.data?.error ||
+          (error.response
+            ? `Error del servidor (${error.response.status})`
+            : 'Error de conexi├│n con el servidor'),
       }
     }
   }
 
   async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
     try {
       const response = await this.client.delete<ApiResponse<T>>(url, config)
       return response.data
     } catch (error: any) {
       return {
         success: false,
-        error: error.response?.data?.error || error.message,
+        error:
+          error.response?.data?.error ||
+          (error.response
+            ? `Error del servidor (${error.response.status})`
+            : 'Error de conexi├│n con el servidor'),
       }
     }
   }
 
   /**
    * GET /api/v1/concesionarios - lista con filtros de ciudad, departamento y
    * estado operativo. Devuelve la paginaci├│n desempaquetada.
    */
   async getConcesionarios(filters: ConcesionarioFilters = {}): Promise<PaginatedResponse<Concesionario>> {
-    const response = await this.get<PaginatedResponse<Concesionario>>('/v1/concesionarios', {
+    const response = await this.get<PaginatedResponse<Concesionario>>('/concesionarios', {
       params: filters,
     })
     if (!response.success || !response.data) {
       throw new Error(response.error || 'Error al obtener los concesionarios')
     }
     return response.data
   }
 
   /** GET /api/v1/concesionarios/:id - obtiene un concesionario por id. */
   async getConcesionarioById(id: string): Promise<Concesionario> {
-    const response = await this.get<Concesionario>(`/v1/concesionarios/${id}`)
+    const response = await this.get<Concesionario>(`/concesionarios/${id}`)
     if (!response.success || !response.data) {
       throw new Error(response.error || 'Concesionario no encontrado')
     }
     return response.data
   }
 
   /** POST /api/v1/concesionarios - crea un concesionario. */
   async createConcesionario(input: CreateConcesionarioInput): Promise<Concesionario> {
-    const response = await this.post<Concesionario>('/v1/concesionarios', input)
+    const response = await this.post<Concesionario>('/concesionarios', input)
     if (!response.success || !response.data) {
       throw new Error(response.error || 'Error al crear el concesionario')
     }
     return response.data
   }
 
   /** PUT /api/v1/concesionarios/:id - actualiza datos o estado operativo. */
   async updateConcesionario(id: string, input: UpdateConcesionarioInput): Promise<Concesionario> {
-    const response = await this.put<Concesionario>(`/v1/concesionarios/${id}`, input)
+    const response = await this.put<Concesionario>(`/concesionarios/${id}`, input)
     if (!response.success || !response.data) {
       throw new Error(response.error || 'Error al actualizar el concesionario')
     }
     return response.data
   }
+
+  /**
+   * GET /api/v1/crm/concesionario/:concesionarioId - historial de
+   * interacciones de un concesionario. Devuelve la paginaci├│n desempaquetada.
+   */
+  async getInteracciones(concesionarioId: string): Promise<PaginatedResponse<InteraccionCrm>> {
+    const response = await this.get<PaginatedResponse<InteraccionCrm>>(
+      `/v1/crm/concesionario/${concesionarioId}`,
+      { params: { limit: 100 } }
+    )
+    if (!response.success || !response.data) {
+      throw new Error(response.error || 'Error al obtener el historial de interacciones')
+    }
+    return response.data
+  }
+
+  /** POST /api/v1/crm - registra una interacci├│n. */
+  async createInteraccion(input: CreateInteraccionInput): Promise<InteraccionCrm> {
+    const response = await this.post<InteraccionCrm>('/v1/crm', input)
+    if (!response.success || !response.data) {
+      throw new Error(response.error || 'Error al registrar la interacci├│n')
+    }
+    return response.data
+  }
+
+  /** GET /api/v1/users - lista usuarios activos (para selects de responsables). */
+  async getUsuarios(): Promise<Usuario[]> {
+    const response = await this.get<Usuario[]>('/v1/users')
+    if (!response.success || !response.data) {
+      throw new Error(response.error || 'Error al obtener los usuarios')
+    }
+    return response.data
+  }
 }
 
 export const apiService = new ApiService()
 export default ApiService
