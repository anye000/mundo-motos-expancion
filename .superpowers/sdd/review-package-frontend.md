# Review package: 918541e..HEAD

## git log --oneline 918541e..HEAD

23e3e7e fix(frontend): ajustes de reconciliaci├│n con el spec de dise├▒o
8ce27a0 feat(frontend): dashboard de concesionarios con mapa, filtros y alta
f83d5ea feat(frontend): tipos de Concesionario alineados con el backend

## git diff --stat 918541e HEAD

 packages/frontend/.env.example                     |   3 +
 packages/frontend/package.json                     |  43 +--
 packages/frontend/src/App.tsx                      |  10 +-
 .../frontend/src/components/ConcesionarioModal.tsx | 323 +++++++++++++++++++++
 .../src/components/DashboardConcesionarios.tsx     | 241 +++++++++++++++
 .../frontend/src/components/MapaConcesionarios.tsx | 132 +++++++++
 packages/frontend/src/hooks/useConcesionarios.ts   |  95 ++++++
 packages/frontend/src/main.tsx                     |   1 +
 packages/frontend/src/services/api.ts              |  51 +++-
 packages/frontend/src/styles/index.css             |  96 ++++++
 packages/frontend/src/types/concesionario.ts       |  77 +++++
 packages/frontend/src/types/index.ts               |  19 +-
 packages/frontend/src/vite-env.d.ts                |   1 +
 packages/frontend/vite.config.ts                   |  18 +-
 14 files changed, 1060 insertions(+), 50 deletions(-)

## git diff -U10 918541e HEAD

diff --git a/packages/frontend/.env.example b/packages/frontend/.env.example
new file mode 100644
index 0000000..45079e4
--- /dev/null
+++ b/packages/frontend/.env.example
@@ -0,0 +1,3 @@
+# URL base de la API (backend). En desarrollo apunta al backend local.
+# En producci├│n, apunta a la URL desplegada (ej. https://tu-api.render.com/api/v1).
+VITE_API_BASE_URL=http://localhost:3000/api/v1
diff --git a/packages/frontend/package.json b/packages/frontend/package.json
index 6d419e8..2c5f6b3 100644
--- a/packages/frontend/package.json
+++ b/packages/frontend/package.json
@@ -1,57 +1,58 @@
 {
   "name": "@mundo-motos/frontend",
   "version": "1.0.0",
   "description": "Frontend React para CRM y Dashboard Mundo Motos",
   "private": true,
   "type": "module",
   "scripts": {
     "dev": "vite",
-    "build": "tsc && vite build",
+    "build": "tsc --noEmit -p tsconfig.app.json && vite build",
     "preview": "vite preview",
-    "type-check": "tsc --noEmit",
+    "type-check": "tsc --noEmit -p tsconfig.app.json",
     "lint": "eslint src --ext ts,tsx",
     "test": "vitest",
     "test:watch": "vitest --watch"
   },
   "dependencies": {
-    "react": "^18.2.0",
-    "react-dom": "^18.2.0",
-    "react-leaflet": "^4.2.3",
-    "leaflet": "^1.9.4",
     "axios": "^1.6.5",
-    "zustand": "^4.4.1",
-    "react-router-dom": "^6.20.1",
-    "react-hot-toast": "^2.4.1",
-    "lucide-react": "^0.294.0",
     "class-variance-authority": "^0.7.0",
     "clsx": "^2.0.0",
-    "tailwind-merge": "^2.2.1",
     "date-fns": "^2.30.0",
+    "leaflet": "^1.9.4",
+    "lucide-react": "^0.294.0",
+    "react": "^18.2.0",
+    "react-dom": "^18.2.0",
+    "react-hot-toast": "^2.4.1",
+    "react-leaflet": "^4.2.1",
+    "react-router-dom": "^6.20.1",
+    "recharts": "^2.10.3",
+    "tailwind-merge": "^2.2.1",
     "zod": "^3.22.4",
-    "recharts": "^2.10.3"
+    "zustand": "^4.4.1"
   },
   "devDependencies": {
+    "@testing-library/jest-dom": "^6.1.5",
+    "@testing-library/react": "^14.1.2",
+    "@types/leaflet": "^1.9.22",
+    "@types/node": "^20.10.6",
     "@types/react": "^18.2.45",
     "@types/react-dom": "^18.2.18",
-    "@types/node": "^20.10.6",
-    "@vitejs/plugin-react": "^4.2.1",
     "@typescript-eslint/eslint-plugin": "^7.0.0",
     "@typescript-eslint/parser": "^7.0.0",
+    "@vitejs/plugin-react": "^4.2.1",
+    "@vitest/ui": "^1.0.4",
+    "autoprefixer": "^10.4.16",
     "eslint": "^8.57.0",
     "eslint-plugin-react-hooks": "^4.6.0",
+    "postcss": "^8.4.32",
+    "tailwindcss": "^3.4.1",
     "typescript": "^5.3.3",
     "vite": "^5.0.8",
     "vite-plugin-pwa": "^0.17.4",
-    "tailwindcss": "^3.4.1",
-    "postcss": "^8.4.32",
-    "autoprefixer": "^10.4.16",
-    "vitest": "^1.0.4",
-    "@vitest/ui": "^1.0.4",
-    "@testing-library/react": "^14.1.2",
-    "@testing-library/jest-dom": "^6.1.5"
+    "vitest": "^1.0.4"
   },
   "engines": {
     "node": ">=18.0.0",
     "npm": ">=9.0.0"
   }
 }
diff --git a/packages/frontend/src/App.tsx b/packages/frontend/src/App.tsx
index f6d383e..d682ba6 100644
--- a/packages/frontend/src/App.tsx
+++ b/packages/frontend/src/App.tsx
@@ -1,33 +1,33 @@
 import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
 import { Toaster } from 'react-hot-toast'
+import DashboardConcesionarios from '@components/DashboardConcesionarios'
 
 function App() {
   return (
     <Router>
-      <div className="flex flex-col min-h-screen bg-mm-light text-mm-primary">
+      <div className="flex flex-col min-h-screen bg-mm-gray-900 text-mm-gray-100">
         <header className="bg-mm-black border-b-4 border-mm-yellow">
           <div className="container mx-auto px-4 py-4">
             <h1 className="text-2xl font-bold text-mm-yellow">Mundo Motos CRM</h1>
-            <p className="text-mm-gray-300">Sistema de Gesti├│n y Geolocalizaci├│n de Concesionarios</p>
+            <p className="text-mm-gray-400">Sistema de Gesti├│n y Geolocalizaci├│n de Concesionarios</p>
           </div>
         </header>
         
         <main className="flex-1 container mx-auto px-4 py-8">
           <Routes>
-            <Route path="/" element={<div>Dashboard - Pr├│ximamente</div>} />
-            {/* Rutas ser├ín agregadas aqu├¡ */}
+            <Route path="/" element={<DashboardConcesionarios />} />
           </Routes>
         </main>
 
         <footer className="bg-mm-black border-t-4 border-mm-yellow mt-auto">
-          <div className="container mx-auto px-4 py-4 text-center text-mm-gray-400">
+          <div className="container mx-auto px-4 py-4 text-center text-mm-gray-500">
             <p>&copy; 2024 Mundo Motos. Todos los derechos reservados.</p>
           </div>
         </footer>
 
         <Toaster position="top-right" />
       </div>
     </Router>
   )
 }
 
diff --git a/packages/frontend/src/components/ConcesionarioModal.tsx b/packages/frontend/src/components/ConcesionarioModal.tsx
new file mode 100644
index 0000000..e983f7c
--- /dev/null
+++ b/packages/frontend/src/components/ConcesionarioModal.tsx
@@ -0,0 +1,323 @@
+import { FormEvent, useEffect, useMemo, useState } from 'react'
+import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
+import { MapPin, X } from 'lucide-react'
+import toast from 'react-hot-toast'
+import { apiService } from '@services/api'
+import { iconoConcesionario } from '@components/MapaConcesionarios'
+import { Concesionario, EstadoOperativo } from '../types/concesionario'
+
+const CENTRO_COLOMBIA: [number, number] = [4.60971, -74.08175]
+
+interface FormConcesionario {
+  nombre: string
+  razon_social: string
+  nit: string
+  email: string
+  telefono: string
+  ciudad: string
+  departamento: string
+  direccion: string
+  latitud: string
+  longitud: string
+  estado: EstadoOperativo
+}
+
+const FORM_INICIAL: FormConcesionario = {
+  nombre: '',
+  razon_social: '',
+  nit: '',
+  email: '',
+  telefono: '',
+  ciudad: '',
+  departamento: '',
+  direccion: '',
+  latitud: '',
+  longitud: '',
+  estado: 'activo',
+}
+
+/** Captura clics en el mini-mapa para fijar las coordenadas. */
+function ClicUbicacion({ onClic }: { onClic: (lat: number, lng: number) => void }) {
+  useMapEvents({
+    click(e) {
+      onClic(e.latlng.lat, e.latlng.lng)
+    },
+  })
+  return null
+}
+
+export interface ConcesionarioModalProps {
+  abierto: boolean
+  onCerrar: () => void
+  onCreado: (concesionario: Concesionario) => void
+}
+
+export function ConcesionarioModal({ abierto, onCerrar, onCreado }: ConcesionarioModalProps) {
+  const [form, setForm] = useState<FormConcesionario>(FORM_INICIAL)
+  const [error, setError] = useState<string | null>(null)
+  const [enviando, setEnviando] = useState(false)
+
+  useEffect(() => {
+    if (abierto) {
+      setForm(FORM_INICIAL)
+      setError(null)
+    }
+  }, [abierto])
+
+  const ubicacion = useMemo(() => {
+    const lat = Number(form.latitud)
+    const lng = Number(form.longitud)
+    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
+    return { lat, lng }
+  }, [form.latitud, form.longitud])
+
+  if (!abierto) return null
+
+  function actualizar(campo: keyof FormConcesionario, valor: string) {
+    setForm((prev) => ({ ...prev, [campo]: valor }))
+  }
+
+  function fijarUbicacion(lat: number, lng: number) {
+    setForm((prev) => ({
+      ...prev,
+      latitud: lat.toFixed(6),
+      longitud: lng.toFixed(6),
+    }))
+  }
+
+  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
+    e.preventDefault()
+    const { nombre, razon_social, nit, email, ciudad, departamento, direccion } = form
+    if (!nombre.trim() || !razon_social.trim() || !nit.trim() || !email.trim()) {
+      setError('Los campos nombre, raz├│n social, NIT y email son obligatorios')
+      return
+    }
+    if (!ciudad.trim() || !departamento.trim() || !direccion.trim()) {
+      setError('Los campos ciudad, departamento y direcci├│n son obligatorios')
+      return
+    }
+    const lat = Number(form.latitud)
+    const lng = Number(form.longitud)
+    if (Number.isNaN(lat) || Number.isNaN(lng)) {
+      setError('Ingresa coordenadas v├ílidas (usa el mapa o los campos lat/lng)')
+      return
+    }
+
+    setEnviando(true)
+    setError(null)
+    try {
+      const creado = await apiService.createConcesionario({
+        nombre: nombre.trim(),
+        razon_social: razon_social.trim(),
+        nit: nit.trim(),
+        email: email.trim(),
+        telefono: form.telefono.trim() || null,
+        ciudad: ciudad.trim(),
+        departamento: departamento.trim(),
+        direccion: direccion.trim(),
+        latitud: lat,
+        longitud: lng,
+        estado: form.estado,
+      })
+      toast.success('Concesionario creado exitosamente')
+      onCreado(creado)
+    } catch (e) {
+      const mensaje = e instanceof Error ? e.message : 'Error al crear el concesionario'
+      setError(mensaje)
+      toast.error(mensaje)
+    } finally {
+      setEnviando(false)
+    }
+  }
+
+  return (
+    <div
+      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
+      onClick={onCerrar}
+    >
+      <div
+        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-mm-gray-800 border border-mm-gray-600 shadow-xl animate-fadeInDown"
+        onClick={(e) => e.stopPropagation()}
+      >
+        <div className="flex items-center justify-between border-b-2 border-mm-yellow px-6 py-4">
+          <div className="flex items-center gap-2">
+            <MapPin className="h-5 w-5 text-mm-yellow" />
+            <h2 className="text-lg font-bold text-mm-yellow">Nuevo concesionario</h2>
+          </div>
+          <button
+            type="button"
+            onClick={onCerrar}
+            className="rounded-lg p-1 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
+            aria-label="Cerrar"
+          >
+            <X className="h-5 w-5" />
+          </button>
+        </div>
+
+        <form onSubmit={manejarEnvio} className="flex flex-col gap-4 px-6 py-5">
+          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Nombre *</span>
+              <input
+                className="input-dark"
+                value={form.nombre}
+                onChange={(e) => actualizar('nombre', e.target.value)}
+                placeholder="Concesionario Centro"
+              />
+            </label>
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Raz├│n social *</span>
+              <input
+                className="input-dark"
+                value={form.razon_social}
+                onChange={(e) => actualizar('razon_social', e.target.value)}
+                placeholder="Mundo Motos S.A.S."
+              />
+            </label>
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">NIT *</span>
+              <input
+                className="input-dark"
+                value={form.nit}
+                onChange={(e) => actualizar('nit', e.target.value)}
+                placeholder="900123456-7"
+              />
+            </label>
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Email *</span>
+              <input
+                type="email"
+                className="input-dark"
+                value={form.email}
+                onChange={(e) => actualizar('email', e.target.value)}
+                placeholder="contacto@mundo.com"
+              />
+            </label>
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Tel├®fono</span>
+              <input
+                className="input-dark"
+                value={form.telefono}
+                onChange={(e) => actualizar('telefono', e.target.value)}
+                placeholder="+57 1 234 5678"
+              />
+            </label>
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Estado operativo</span>
+              <select
+                className="input-dark"
+                value={form.estado}
+                onChange={(e) => actualizar('estado', e.target.value)}
+              >
+                <option value="activo">Activo</option>
+                <option value="inactivo">Inactivo</option>
+              </select>
+            </label>
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Ciudad *</span>
+              <input
+                className="input-dark"
+                value={form.ciudad}
+                onChange={(e) => actualizar('ciudad', e.target.value)}
+                placeholder="Bogot├í"
+              />
+            </label>
+            <label className="block">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Departamento *</span>
+              <input
+                className="input-dark"
+                value={form.departamento}
+                onChange={(e) => actualizar('departamento', e.target.value)}
+                placeholder="Cundinamarca"
+              />
+            </label>
+            <label className="block sm:col-span-2">
+              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Direcci├│n *</span>
+              <input
+                className="input-dark"
+                value={form.direccion}
+                onChange={(e) => actualizar('direccion', e.target.value)}
+                placeholder="Av. 68 # 22-10"
+              />
+            </label>
+          </div>
+
+          <div>
+            <span className="mb-1 block text-sm font-medium text-mm-gray-300">
+              Ubicaci├│n (haz clic en el mapa o ingresa las coordenadas)
+            </span>
+            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
+              <label className="block">
+                <span className="mb-1 block text-xs text-mm-gray-400">Latitud</span>
+                <input
+                  type="number"
+                  step="any"
+                  className="input-dark"
+                  value={form.latitud}
+                  onChange={(e) => actualizar('latitud', e.target.value)}
+                  placeholder="4.60971"
+                />
+              </label>
+              <label className="block">
+                <span className="mb-1 block text-xs text-mm-gray-400">Longitud</span>
+                <input
+                  type="number"
+                  step="any"
+                  className="input-dark"
+                  value={form.longitud}
+                  onChange={(e) => actualizar('longitud', e.target.value)}
+                  placeholder="-74.08175"
+                />
+              </label>
+            </div>
+            <div className="mt-3 h-64 w-full overflow-hidden rounded-lg border border-mm-gray-600">
+              <MapContainer
+                center={CENTRO_COLOMBIA}
+                zoom={5}
+                scrollWheelZoom={false}
+                className="h-full w-full"
+              >
+                <TileLayer
+                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
+                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
+                />
+                <ClicUbicacion onClic={fijarUbicacion} />
+                {ubicacion && (
+                  <Marker
+                    position={[ubicacion.lat, ubicacion.lng]}
+                    icon={iconoConcesionario('activo')}
+                  />
+                )}
+              </MapContainer>
+            </div>
+          </div>
+
+          {error && (
+            <p className="rounded-lg bg-mm-error/10 border border-mm-error/40 px-3 py-2 text-sm text-mm-error">
+              {error}
+            </p>
+          )}
+
+          <div className="flex justify-end gap-3 border-t border-mm-gray-700 pt-4">
+            <button
+              type="button"
+              onClick={onCerrar}
+              className="rounded-lg px-4 py-2 text-sm font-semibold text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
+            >
+              Cancelar
+            </button>
+            <button
+              type="submit"
+              disabled={enviando}
+              className="rounded-lg bg-mm-yellow px-4 py-2 text-sm font-bold text-mm-black hover:bg-mm-yellow-dark disabled:opacity-50 transition-colors"
+            >
+              {enviando ? 'Guardando...' : 'Guardar concesionario'}
+            </button>
+          </div>
+        </form>
+      </div>
+    </div>
+  )
+}
+
+export default ConcesionarioModal
diff --git a/packages/frontend/src/components/DashboardConcesionarios.tsx b/packages/frontend/src/components/DashboardConcesionarios.tsx
new file mode 100644
index 0000000..8dfff15
--- /dev/null
+++ b/packages/frontend/src/components/DashboardConcesionarios.tsx
@@ -0,0 +1,241 @@
+import { useMemo, useState } from 'react'
+import { Building2, CheckCircle2, Filter, Loader2, MapPin, Plus, XCircle } from 'lucide-react'
+import { useConcesionarios } from '@hooks/useConcesionarios'
+import { MapaConcesionarios } from '@components/MapaConcesionarios'
+import { ConcesionarioModal } from '@components/ConcesionarioModal'
+import { Concesionario, EstadoOperativo } from '../types/concesionario'
+
+function BadgeEstado({ estado }: { estado: EstadoOperativo }) {
+  return estado === 'activo' ? (
+    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mm-success/15 text-mm-success border border-mm-success/30">
+      Activo
+    </span>
+  ) : (
+    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mm-error/15 text-mm-error border border-mm-error/30">
+      Inactivo
+    </span>
+  )
+}
+
+export function DashboardConcesionarios() {
+  const {
+    concesionarios,
+    cargando,
+    error,
+    filtros,
+    cambiarFiltro,
+    limpiarFiltros,
+    ciudades,
+    departamentos,
+    recargar,
+  } = useConcesionarios()
+  const [seleccionado, setSeleccionado] = useState<Concesionario | null>(null)
+  const [modalAbierto, setModalAbierto] = useState(false)
+
+  const totales = useMemo(
+    () => ({
+      total: concesionarios.length,
+      activos: concesionarios.filter((c) => c.estado === 'activo').length,
+      inactivos: concesionarios.filter((c) => c.estado === 'inactivo').length,
+    }),
+    [concesionarios]
+  )
+
+  return (
+    <div className="flex flex-col gap-6">
+      {/* Estad├¡sticas */}
+      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
+        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
+          <div className="rounded-lg bg-mm-gray-900 p-2.5">
+            <Building2 className="h-5 w-5 text-mm-yellow" />
+          </div>
+          <div>
+            <p className="text-xs font-medium text-mm-gray-400">Total concesionarios</p>
+            <p className="text-2xl font-bold text-white">{totales.total}</p>
+          </div>
+        </div>
+        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
+          <div className="rounded-lg bg-mm-gray-900 p-2.5">
+            <CheckCircle2 className="h-5 w-5 text-mm-success" />
+          </div>
+          <div>
+            <p className="text-xs font-medium text-mm-gray-400">Activos</p>
+            <p className="text-2xl font-bold text-white">{totales.activos}</p>
+          </div>
+        </div>
+        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
+          <div className="rounded-lg bg-mm-gray-900 p-2.5">
+            <XCircle className="h-5 w-5 text-mm-error" />
+          </div>
+          <div>
+            <p className="text-xs font-medium text-mm-gray-400">Inactivos</p>
+            <p className="text-2xl font-bold text-white">{totales.inactivos}</p>
+          </div>
+        </div>
+      </div>
+
+      {error && (
+        <div className="flex items-center justify-between rounded-xl bg-mm-error/10 border border-mm-error/40 px-4 py-3">
+          <p className="text-sm text-mm-error">{error}</p>
+          <button
+            type="button"
+            onClick={recargar}
+            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error hover:bg-mm-error/10 transition-colors"
+          >
+            Reintentar
+          </button>
+        </div>
+      )}
+
+      {/* Mapa + panel lateral */}
+      <div className="flex flex-col lg:flex-row gap-6">
+        <div className="relative lg:flex-1 min-h-[420px] lg:min-h-[560px] overflow-hidden rounded-xl border border-mm-gray-700 bg-mm-gray-800">
+          <MapaConcesionarios
+            concesionarios={concesionarios}
+            seleccionado={seleccionado}
+            onSeleccionar={setSeleccionado}
+          />
+          {cargando && (
+            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
+              <div className="flex items-center gap-2 rounded-lg bg-mm-gray-800 px-4 py-2 text-sm text-mm-gray-200">
+                <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
+                Cargando concesionarios...
+              </div>
+            </div>
+          )}
+        </div>
+
+        <aside className="flex w-full flex-col gap-4 lg:w-[380px]">
+          {/* Filtros */}
+          <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4">
+            <div className="mb-3 flex items-center justify-between">
+              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
+                <Filter className="h-4 w-4 text-mm-yellow" />
+                Filtros
+              </h3>
+              <button
+                type="button"
+                onClick={limpiarFiltros}
+                className="text-xs font-medium text-mm-gray-400 hover:text-mm-yellow transition-colors"
+              >
+                Limpiar
+              </button>
+            </div>
+            <div className="flex flex-col gap-3">
+              <label className="block">
+                <span className="mb-1 block text-xs font-medium text-mm-gray-400">Departamento</span>
+                <select
+                  className="input-dark"
+                  value={filtros.departamento}
+                  onChange={(e) => cambiarFiltro('departamento', e.target.value)}
+                >
+                  <option value="">Todos los departamentos</option>
+                  {departamentos.map((departamento) => (
+                    <option key={departamento} value={departamento}>
+                      {departamento}
+                    </option>
+                  ))}
+                </select>
+              </label>
+              <label className="block">
+                <span className="mb-1 block text-xs font-medium text-mm-gray-400">Ciudad</span>
+                <select
+                  className="input-dark"
+                  value={filtros.ciudad}
+                  onChange={(e) => cambiarFiltro('ciudad', e.target.value)}
+                >
+                  <option value="">Todas las ciudades</option>
+                  {ciudades.map((ciudad) => (
+                    <option key={ciudad} value={ciudad}>
+                      {ciudad}
+                    </option>
+                  ))}
+                </select>
+              </label>
+              <label className="block">
+                <span className="mb-1 block text-xs font-medium text-mm-gray-400">Estado operativo</span>
+                <select
+                  className="input-dark"
+                  value={filtros.estado}
+                  onChange={(e) => cambiarFiltro('estado', e.target.value)}
+                >
+                  <option value="">Todos los estados</option>
+                  <option value="activo">Activo</option>
+                  <option value="inactivo">Inactivo</option>
+                </select>
+              </label>
+            </div>
+          </div>
+
+          {/* Listado */}
+          <div className="flex flex-1 flex-col rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4">
+            <div className="mb-3 flex items-center justify-between">
+              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
+                <MapPin className="h-4 w-4 text-mm-yellow" />
+                Concesionarios
+                <span className="rounded-full bg-mm-gray-700 px-2 py-0.5 text-xs text-mm-gray-300">
+                  {concesionarios.length}
+                </span>
+              </h3>
+              <button
+                type="button"
+                onClick={() => setModalAbierto(true)}
+                className="flex items-center gap-1 rounded-lg bg-mm-yellow px-3 py-1.5 text-xs font-bold text-mm-black hover:bg-mm-yellow-dark transition-colors"
+              >
+                <Plus className="h-3.5 w-3.5" />
+                Nuevo
+              </button>
+            </div>
+
+            {concesionarios.length === 0 && !cargando ? (
+              <p className="py-8 text-center text-sm text-mm-gray-400">
+                No hay concesionarios que coincidan con los filtros.
+              </p>
+            ) : (
+              <ul className="max-h-[320px] flex-1 space-y-2 overflow-y-auto pr-1">
+                {concesionarios.map((concesionario) => {
+                  const activo = seleccionado?.id === concesionario.id
+                  return (
+                    <li key={concesionario.id}>
+                      <button
+                        type="button"
+                        onClick={() => setSeleccionado(concesionario)}
+                        className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
+                          activo
+                            ? 'border-mm-yellow bg-mm-gray-700'
+                            : 'border-mm-gray-700 bg-mm-gray-900 hover:bg-mm-gray-700'
+                        }`}
+                      >
+                        <div className="flex items-center justify-between gap-2">
+                          <p className="truncate text-sm font-semibold text-white">
+                            {concesionario.nombre}
+                          </p>
+                          <BadgeEstado estado={concesionario.estado} />
+                        </div>
+                        <p className="mt-0.5 text-xs text-mm-gray-400">
+                          {concesionario.ciudad} ┬À {concesionario.departamento}
+                        </p>
+                      </button>
+                    </li>
+                  )
+                })}
+              </ul>
+            )}
+          </div>
+        </aside>
+      </div>
+
+      <ConcesionarioModal
+        abierto={modalAbierto}
+        onCerrar={() => setModalAbierto(false)}
+        onCreado={() => {
+          setModalAbierto(false)
+          setSeleccionado(null)
+          recargar()
+        }}
+      />
+    </div>
+  )
+}
+
+export default DashboardConcesionarios
diff --git a/packages/frontend/src/components/MapaConcesionarios.tsx b/packages/frontend/src/components/MapaConcesionarios.tsx
new file mode 100644
index 0000000..334ad04
--- /dev/null
+++ b/packages/frontend/src/components/MapaConcesionarios.tsx
@@ -0,0 +1,132 @@
+import { useEffect } from 'react'
+import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
+import L from 'leaflet'
+import { Concesionario, Coordenadas, EstadoOperativo } from '../types/concesionario'
+
+const CENTRO_COLOMBIA: [number, number] = [4.60971, -74.08175]
+
+/** Crea el icono personalizado (pin) con la identidad de Mundo Motos. */
+export function iconoConcesionario(estado: EstadoOperativo): L.DivIcon {
+  const activo = estado === 'activo'
+  return L.divIcon({
+    className: 'mm-pin-wrapper',
+    html: `<div class="mm-pin ${activo ? 'mm-pin-activo' : 'mm-pin-inactivo'}"></div>`,
+    iconSize: [28, 28],
+    iconAnchor: [14, 28],
+    popupAnchor: [0, -30],
+  })
+}
+
+/** Ajusta la vista del mapa a los concesionarios o vuela al seleccionado. */
+function AjustarVista({
+  concesionarios,
+  seleccionado,
+}: {
+  concesionarios: Concesionario[]
+  seleccionado: Concesionario | null
+}) {
+  const map = useMap()
+
+  useEffect(() => {
+    if (seleccionado) {
+      map.flyTo([seleccionado.latitud, seleccionado.longitud], 13, { duration: 0.8 })
+      return
+    }
+    if (concesionarios.length > 0) {
+      const bounds = L.latLngBounds(
+        concesionarios.map((c) => [c.latitud, c.longitud] as [number, number])
+      )
+      map.fitBounds(bounds, { padding: [48, 48] })
+    } else {
+      map.setView(CENTRO_COLOMBIA, 5)
+    }
+  }, [concesionarios, seleccionado, map])
+
+  return null
+}
+
+/** Captura clics en el mapa para seleccionar una ubicaci├│n. */
+function ClicUbicacion({ onClic }: { onClic: (lat: number, lng: number) => void }) {
+  useMapEvents({
+    click(e) {
+      onClic(e.latlng.lat, e.latlng.lng)
+    },
+  })
+  return null
+}
+
+export interface MapaConcesionariosProps {
+  concesionarios: Concesionario[]
+  seleccionado?: Concesionario | null
+  onSeleccionar?: (concesionario: Concesionario) => void
+  modoSeleccionUbicacion?: boolean
+  ubicacionSeleccionada?: Coordenadas | null
+  onClicUbicacion?: (lat: number, lng: number) => void
+}
+
+export function MapaConcesionarios({
+  concesionarios,
+  seleccionado = null,
+  onSeleccionar,
+  modoSeleccionUbicacion = false,
+  ubicacionSeleccionada = null,
+  onClicUbicacion,
+}: MapaConcesionariosProps) {
+  return (
+    <MapContainer center={CENTRO_COLOMBIA} zoom={5} scrollWheelZoom={false} className="h-full w-full">
+      <TileLayer
+        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
+        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
+      />
+      {modoSeleccionUbicacion ? (
+        <>
+          <ClicUbicacion onClic={onClicUbicacion ?? (() => undefined)} />
+          {ubicacionSeleccionada && (
+            <Marker
+              position={[ubicacionSeleccionada.lat, ubicacionSeleccionada.lng]}
+              icon={iconoConcesionario('activo')}
+            >
+              <Popup>Ubicaci├│n seleccionada</Popup>
+            </Marker>
+          )}
+        </>
+      ) : (
+        <>
+          {concesionarios.map((concesionario) => (
+            <Marker
+              key={concesionario.id}
+              position={[concesionario.latitud, concesionario.longitud]}
+              icon={iconoConcesionario(concesionario.estado)}
+              eventHandlers={{
+                click: () => onSeleccionar?.(concesionario),
+              }}
+            >
+              <Popup>
+                <div>
+                  <div className="popup-concesionario-badges">
+                    <span className={`badge-estado ${concesionario.estado}`}>
+                      {concesionario.estado === 'activo' ? 'Activo' : 'Inactivo'}
+                    </span>
+                  </div>
+                  <h3 className="popup-concesionario-titulo">{concesionario.nombre}</h3>
+                  <p className="popup-concesionario-texto">C├│digo: {concesionario.nit}</p>
+                  <p className="popup-concesionario-texto">
+                    {concesionario.ciudad} ┬À {concesionario.departamento}
+                  </p>
+                  <p className="popup-concesionario-texto">{concesionario.direccion}</p>
+                  {concesionario.telefono && (
+                    <p className="popup-concesionario-texto">{concesionario.telefono}</p>
+                  )}
+                  <p className="popup-concesionario-texto">{concesionario.email}</p>
+                </div>
+              </Popup>
+            </Marker>
+          ))}
+          <AjustarVista concesionarios={concesionarios} seleccionado={seleccionado} />
+        </>
+      )}
+    </MapContainer>
+  )
+}
+
+export default MapaConcesionarios
diff --git a/packages/frontend/src/hooks/useConcesionarios.ts b/packages/frontend/src/hooks/useConcesionarios.ts
new file mode 100644
index 0000000..b6918f0
--- /dev/null
+++ b/packages/frontend/src/hooks/useConcesionarios.ts
@@ -0,0 +1,95 @@
+import { useCallback, useEffect, useState } from 'react'
+import { apiService } from '@services/api'
+import { Concesionario, ConcesionarioFilters, EstadoOperativo } from '../types/concesionario'
+
+export interface FiltrosConcesionarios {
+  ciudad: string
+  departamento: string
+  estado: EstadoOperativo | ''
+}
+
+const FILTROS_INICIALES: FiltrosConcesionarios = {
+  ciudad: '',
+  departamento: '',
+  estado: '',
+}
+
+export interface UseConcesionariosReturn {
+  concesionarios: Concesionario[]
+  cargando: boolean
+  error: string | null
+  filtros: FiltrosConcesionarios
+  cambiarFiltro: (campo: keyof FiltrosConcesionarios, valor: string) => void
+  limpiarFiltros: () => void
+  ciudades: string[]
+  departamentos: string[]
+  recargar: () => void
+}
+
+function toConcesionarioFilters(filtros: FiltrosConcesionarios): ConcesionarioFilters {
+  return {
+    ciudad: filtros.ciudad || undefined,
+    departamento: filtros.departamento || undefined,
+    estado: filtros.estado || undefined,
+    limit: 100,
+  }
+}
+
+/**
+ * Hook de datos del dashboard de concesionarios: gestiona la lista, los
+ * filtros (ciudad, departamento, estado operativo) y las opciones de los
+ * selectores, consultando la API del backend.
+ */
+export function useConcesionarios(): UseConcesionariosReturn {
+  const [concesionarios, setConcesionarios] = useState<Concesionario[]>([])
+  const [cargando, setCargando] = useState(false)
+  const [error, setError] = useState<string | null>(null)
+  const [filtros, setFiltros] = useState<FiltrosConcesionarios>(FILTROS_INICIALES)
+  const [ciudades, setCiudades] = useState<string[]>([])
+  const [departamentos, setDepartamentos] = useState<string[]>([])
+
+  const cargar = useCallback(async (filtrosActivos: FiltrosConcesionarios) => {
+    setCargando(true)
+    setError(null)
+    try {
+      const resultado = await apiService.getConcesionarios(toConcesionarioFilters(filtrosActivos))
+      setConcesionarios(resultado.data)
+      if (!filtrosActivos.ciudad && !filtrosActivos.departamento && !filtrosActivos.estado) {
+        setCiudades(Array.from(new Set(resultado.data.map((c) => c.ciudad))).sort())
+        setDepartamentos(Array.from(new Set(resultado.data.map((c) => c.departamento))).sort())
+      }
+    } catch (e) {
+      setError(e instanceof Error ? e.message : 'Error al cargar los concesionarios')
+    } finally {
+      setCargando(false)
+    }
+  }, [])
+
+  useEffect(() => {
+    void cargar(filtros)
+  }, [cargar, filtros])
+
+  const cambiarFiltro = useCallback((campo: keyof FiltrosConcesionarios, valor: string) => {
+    setFiltros((prev) => ({ ...prev, [campo]: valor }))
+  }, [])
+
+  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_INICIALES), [])
+
+  const recargar = useCallback(() => {
+    void cargar(filtros)
+  }, [cargar, filtros])
+
+  return {
+    concesionarios,
+    cargando,
+    error,
+    filtros,
+    cambiarFiltro,
+    limpiarFiltros,
+    ciudades,
+    departamentos,
+    recargar,
+  }
+}
+
+export default useConcesionarios
diff --git a/packages/frontend/src/main.tsx b/packages/frontend/src/main.tsx
index d28e006..ee7ecf0 100644
--- a/packages/frontend/src/main.tsx
+++ b/packages/frontend/src/main.tsx
@@ -1,12 +1,13 @@
 import React from 'react'
 import ReactDOM from 'react-dom/client'
+import 'leaflet/dist/leaflet.css'
 import App from './App.tsx'
 import './styles/index.css'
 
 if ('serviceWorker' in navigator) {
   window.addEventListener('load', () => {
     navigator.serviceWorker.register('/sw.js').catch((error) => {
       console.error('Service Worker registration failed:', error)
     })
   })
 }
diff --git a/packages/frontend/src/services/api.ts b/packages/frontend/src/services/api.ts
index ebca4a2..6271d28 100644
--- a/packages/frontend/src/services/api.ts
+++ b/packages/frontend/src/services/api.ts
@@ -1,17 +1,23 @@
 import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
-import { ApiResponse } from '@types/index'
+import { ApiResponse, PaginatedResponse } from '../types/index'
+import {
+  Concesionario,
+  ConcesionarioFilters,
+  CreateConcesionarioInput,
+  UpdateConcesionarioInput,
+} from '../types/concesionario'
 
 class ApiService {
   private client: AxiosInstance
 
-  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') {
+  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') {
     this.client = axios.create({
       baseURL,
       headers: {
         'Content-Type': 'application/json',
       },
     })
 
     // Interceptor para agregar token de autenticaci├│n
     this.client.interceptors.request.use(
       (config) => {
@@ -90,14 +96,55 @@ class ApiService {
     try {
       const response = await this.client.delete<ApiResponse<T>>(url, config)
       return response.data
     } catch (error: any) {
       return {
         success: false,
         error: error.response?.data?.error || error.message,
       }
     }
   }
+
+  /**
+   * GET /api/v1/concesionarios - lista con filtros de ciudad, departamento y
+   * estado operativo. Devuelve la paginaci├│n desempaquetada.
+   */
+  async getConcesionarios(filters: ConcesionarioFilters = {}): Promise<PaginatedResponse<Concesionario>> {
+    const response = await this.get<PaginatedResponse<Concesionario>>('/v1/concesionarios', {
+      params: filters,
+    })
+    if (!response.success || !response.data) {
+      throw new Error(response.error || 'Error al obtener los concesionarios')
+    }
+    return response.data
+  }
+
+  /** GET /api/v1/concesionarios/:id - obtiene un concesionario por id. */
+  async getConcesionarioById(id: string): Promise<Concesionario> {
+    const response = await this.get<Concesionario>(`/v1/concesionarios/${id}`)
+    if (!response.success || !response.data) {
+      throw new Error(response.error || 'Concesionario no encontrado')
+    }
+    return response.data
+  }
+
+  /** POST /api/v1/concesionarios - crea un concesionario. */
+  async createConcesionario(input: CreateConcesionarioInput): Promise<Concesionario> {
+    const response = await this.post<Concesionario>('/v1/concesionarios', input)
+    if (!response.success || !response.data) {
+      throw new Error(response.error || 'Error al crear el concesionario')
+    }
+    return response.data
+  }
+
+  /** PUT /api/v1/concesionarios/:id - actualiza datos o estado operativo. */
+  async updateConcesionario(id: string, input: UpdateConcesionarioInput): Promise<Concesionario> {
+    const response = await this.put<Concesionario>(`/v1/concesionarios/${id}`, input)
+    if (!response.success || !response.data) {
+      throw new Error(response.error || 'Error al actualizar el concesionario')
+    }
+    return response.data
+  }
 }
 
 export const apiService = new ApiService()
 export default ApiService
diff --git a/packages/frontend/src/styles/index.css b/packages/frontend/src/styles/index.css
index c0506ef..667ec5b 100644
--- a/packages/frontend/src/styles/index.css
+++ b/packages/frontend/src/styles/index.css
@@ -57,20 +57,24 @@ body {
   }
 
   .btn-ghost {
     @apply px-4 py-2 rounded-lg font-semibold bg-transparent text-mm-black border border-mm-black hover:bg-mm-gray-100 transition-colors duration-200;
   }
 
   .input-field {
     @apply w-full px-3 py-2 border border-mm-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mm-yellow focus:border-transparent;
   }
 
+  .input-dark {
+    @apply w-full px-3 py-2 rounded-lg border border-mm-gray-600 bg-mm-gray-900 text-mm-gray-100 focus:outline-none focus:ring-2 focus:ring-mm-yellow focus:border-transparent text-sm;
+  }
+
   .card {
     @apply bg-white rounded-lg shadow-base border border-mm-gray-200 p-6;
   }
 
   .badge-success {
     @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mm-success/10 text-mm-success;
   }
 
   .badge-error {
     @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mm-error/10 text-mm-error;
@@ -123,10 +127,102 @@ body {
   border-radius: 50%;
   width: 40px;
   height: 40px;
   animation: spin 1s linear infinite;
 }
 
 @keyframes spin {
   0% { transform: rotate(0deg); }
   100% { transform: rotate(360deg); }
 }
+
+/* ===== Mapa / Leaflet ===== */
+.mm-pin-wrapper {
+  background: transparent;
+  border: none;
+}
+
+.mm-pin {
+  width: 28px;
+  height: 28px;
+  border-radius: 50% 50% 50% 0;
+  transform: rotate(-45deg);
+  border: 3px solid #000000;
+  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
+  cursor: pointer;
+  transition: transform 0.15s ease;
+}
+
+.mm-pin:hover {
+  transform: rotate(-45deg) scale(1.2);
+}
+
+.mm-pin-activo {
+  background: #ffcc00;
+}
+
+.mm-pin-inactivo {
+  background: #9ca3af;
+}
+
+.leaflet-container {
+  font-family: 'Inter', system-ui, sans-serif;
+  background: #111827;
+}
+
+.leaflet-popup-content-wrapper,
+.leaflet-popup-tip {
+  background: #1f2937;
+  color: #f3f4f6;
+  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
+}
+
+.leaflet-popup-content-wrapper {
+  border: 2px solid #ffcc00;
+  border-radius: 0.75rem;
+}
+
+.leaflet-popup-content {
+  margin: 0.75rem 1rem;
+}
+
+.popup-concesionario-badges {
+  display: flex;
+  align-items: center;
+  gap: 0.5rem;
+  margin-bottom: 0.25rem;
+}
+
+.popup-concesionario-titulo {
+  margin: 0;
+  color: #ffcc00;
+  font-weight: 700;
+  font-size: 1rem;
+}
+
+.popup-concesionario-texto {
+  margin: 0.125rem 0;
+  color: #d1d5db;
+  font-size: 0.8rem;
+  line-height: 1.25;
+}
+
+.badge-estado {
+  display: inline-flex;
+  align-items: center;
+  padding: 0.125rem 0.5rem;
+  border-radius: 9999px;
+  font-size: 0.7rem;
+  font-weight: 600;
+}
+
+.badge-estado.activo {
+  background: rgba(16, 185, 129, 0.15);
+  color: #10b981;
+  border: 1px solid rgba(16, 185, 129, 0.3);
+}
+
+.badge-estado.inactivo {
+  background: rgba(239, 68, 68, 0.15);
+  color: #ef4444;
+  border: 1px solid rgba(239, 68, 68, 0.3);
+}
diff --git a/packages/frontend/src/types/concesionario.ts b/packages/frontend/src/types/concesionario.ts
new file mode 100644
index 0000000..0857813
--- /dev/null
+++ b/packages/frontend/src/types/concesionario.ts
@@ -0,0 +1,77 @@
+/** Tipos del m├│dulo Concesionarios alineados con el backend (snake_case). */
+
+export type EstadoOperativo = 'activo' | 'inactivo';
+
+export interface Concesionario {
+  id: string;
+  nombre: string;
+  razon_social: string;
+  nit: string;
+  email: string;
+  telefono: string | null;
+  ciudad: string;
+  departamento: string;
+  direccion: string;
+  latitud: number;
+  longitud: number;
+  gerente_id: string | null;
+  estado: EstadoOperativo;
+  metadatos: Record<string, unknown> | null;
+  created_at: string;
+  updated_at: string;
+  deleted_at: string | null;
+}
+
+export interface CreateConcesionarioInput {
+  nombre: string;
+  razon_social: string;
+  nit: string;
+  email: string;
+  telefono?: string | null;
+  ciudad: string;
+  departamento: string;
+  direccion: string;
+  latitud: number;
+  longitud: number;
+  gerente_id?: string | null;
+  estado?: EstadoOperativo;
+  metadatos?: Record<string, unknown> | null;
+}
+
+export interface UpdateConcesionarioInput {
+  nombre?: string;
+  razon_social?: string;
+  nit?: string;
+  email?: string;
+  telefono?: string | null;
+  ciudad?: string;
+  departamento?: string;
+  direccion?: string;
+  latitud?: number;
+  longitud?: number;
+  gerente_id?: string | null;
+  estado?: EstadoOperativo;
+  metadatos?: Record<string, unknown> | null;
+}
+
+export interface ConcesionarioFilters {
+  estado?: EstadoOperativo;
+  ciudad?: string;
+  departamento?: string;
+  page?: number;
+  limit?: number;
+}
+
+export interface PaginatedConcesionarios {
+  data: Concesionario[];
+  total: number;
+  page: number;
+  limit: number;
+  hasMore: boolean;
+}
+
+/** Coordenadas geogr├íficas (lat/lng). */
+export interface Coordenadas {
+  lat: number;
+  lng: number;
+}
diff --git a/packages/frontend/src/types/index.ts b/packages/frontend/src/types/index.ts
index 7f3ef2b..d7a6f2b 100644
--- a/packages/frontend/src/types/index.ts
+++ b/packages/frontend/src/types/index.ts
@@ -8,38 +8,21 @@ export interface User {
   id: UUID
   email: string
   nombre: string
   apellido: string
   rol: 'admin' | 'gerente' | 'vendedor' | 'operador'
   estado: 'activo' | 'inactivo'
   createdAt: Date
   updatedAt: Date
 }
 
-export interface Concesionario {
-  id: UUID
-  nombre: string
-  razonSocial: string
-  nit: string
-  email: string
-  telefono: string
-  ciudad: string
-  departamento: string
-  direccion: string
-  latitud: number
-  longitud: number
-  gerente: UUID
-  estado: 'activo' | 'inactivo'
-  metadatos?: Record<string, any>
-  createdAt: Date
-  updatedAt: Date
-}
+export type { Concesionario, ConcesionarioFilters, CreateConcesionarioInput, UpdateConcesionarioInput, PaginatedConcesionarios, EstadoOperativo } from './concesionario'
 
 export interface Ubicacion {
   id: UUID
   concesionarioId: UUID
   nombre: string
   latitud: number
   longitud: number
   direccion: string
   tipo: 'principal' | 'secundaria' | 'almacen'
   estado: 'activo' | 'inactivo'
diff --git a/packages/frontend/src/vite-env.d.ts b/packages/frontend/src/vite-env.d.ts
new file mode 100644
index 0000000..11f02fe
--- /dev/null
+++ b/packages/frontend/src/vite-env.d.ts
@@ -0,0 +1 @@
+/// <reference types="vite/client" />
diff --git a/packages/frontend/vite.config.ts b/packages/frontend/vite.config.ts
index 6695da1..8b6ae32 100644
--- a/packages/frontend/vite.config.ts
+++ b/packages/frontend/vite.config.ts
@@ -119,19 +119,29 @@ export default defineConfig({
         rewrite: (path) => path.replace(/^\/api/, ''),
       },
     },
   },
   build: {
     outDir: 'dist',
     sourcemap: false,
     minify: 'terser',
     rollupOptions: {
       output: {
-        manualChunks: {
-          react: ['react', 'react-dom'],
-          leaflet: ['leaflet', 'react-leaflet'],
-          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
+        // manualChunks en forma de funci├│n: Rollup solo la invoca para m├│dulos
+        // que existen en el grafo, de modo que dependencias ausentes o vac├¡as
+        // nunca provocan un fallo del build (a diferencia de la forma objeto).
+        manualChunks(id) {
+          if (id.includes('node_modules')) {
+            if (id.includes('leaflet')) {
+              return 'leaflet'
+            }
+            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
+              return 'react'
+            }
+            return 'vendor'
+          }
+          return undefined
         },
       },
     },
   },
 })
