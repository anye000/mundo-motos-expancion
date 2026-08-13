# Mapa de Concesionarios estilo Google Maps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolucionar el mapa de concesionarios de Mundo Motos CRM a una experiencia tipo Google Maps: buscador de direcciones (geocoding Nominatim), pines SVG corporativos, popups enriquecidos con accesos directos de gestión, botón "Centrar mapa", marcador arrastrable en el modal y capas de z-index correctas (`z-0` mapa, `z-[1000]` modales). Compilación limpia y cero azul/cian.

**Architecture:** Dos componentes nuevos (`src/utils/geocodificacion.ts` y `src/components/BuscadorDireccion.tsx`) proveen el geocoding reutilizable; se montan como hijos de `MapContainer` para usar `useMap()`. `MapaConcesionarios` recibe pines SVG (`L.divIcon` inline), popups con botones `Editar`/`Gestionar`, botón `CentrarMapa` y el buscador. `ConcesionarioModal` incorpora marcador `draggable` con actualización en tiempo real, `flyTo` automático y autocompletado de campos vacíos. Los modales suben a `z-[1000]` y los overlays del mapa viven dentro de contenedores `relative z-0`.

**Tech Stack:** React 18, TypeScript 5 (strict), Tailwind CSS 3, react-leaflet 4.2.1, leaflet 1.9.4, lucide-react 0.294, Vite 5, Nominatim (OpenStreetMap, `fetch`).

## Global Constraints

- **No agregar dependencias**: react-leaflet 4.2.1, leaflet 1.9.4 y lucide-react ya están instalados. No instalar nada nuevo.
- **PowerShell**: usar siempre `npm.cmd` / `npx.cmd`, nunca `npm` / `npx`.
- **Estilo por archivo**: los archivos **nuevos** se escriben con punto y coma (estilo Prettier). Los archivos **existentes modificados** (`MapaConcesionarios.tsx`, `ConcesionarioModal.tsx`, `DashboardConcesionarios.tsx`, `DetalleConcesionarioModal.tsx`, `ConfirmarEliminacionModal.tsx`) conservan su estilo local **sin punto y coma** para diffs mínimos.
- **Español** en textos de UI, comentarios y mensajes de error.
- **Cero azul/cian**: NO usar hex de la lista de bloqueo de `scripts/purge-blue.mjs` (p. ej. `#0078a8`, `#3388ff`, grises azulados `#6b7280`, `#94a3b8`, etc.). Colores permitidos: `#000000`, `#FFCC00`, `#FFFFFF`, `#A3A3A3`, `#F59E0B`, `#10B981`, `#EF4444`, `#737373`, etc.
- **No hay suite de tests** en el repo. La verificación de cada tarea es `npx.cmd tsc --noEmit -p tsconfig.app.json` (desde `packages/frontend`) y al final el build completo. Ejecutar siempre desde `packages/frontend`.
- **Lint roto repo-wide** (regla inexistente en `.eslintrc.json`): no depender de ESLint.
- **No modificar el backend.**
- Espec fuente: `docs/superpowers/specs/2026-08-13-mapa-concesionarios-google-maps-design.md`.

---

### Task 1: Utilidad de geocodificación (Nominatim)

**Files:**
- Create: `packages/frontend/src/utils/geocodificacion.ts`

**Interfaces:**
- Produces (lo que usan Task 2, 4 y 5, importado como `../utils/geocodificacion` o `@utils/geocodificacion`):
  - `interface ResultadoGeocodificacion { lat: number; lng: number; displayName: string; direccion: string; ciudad: string; departamento: string }`
  - `buscarDireccion(consulta: string, signal?: AbortSignal): Promise<ResultadoGeocodificacion[]>`

- [ ] **Step 1: Crear `src/utils/geocodificacion.ts`**

```ts
/** Cliente de geocodificación con Nominatim (OpenStreetMap). Solo lectura, sin claves. */

export interface DireccionNominatim {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
}

export interface ResultadoGeocodificacion {
  lat: number;
  lng: number;
  displayName: string;
  direccion: string;
  ciudad: string;
  departamento: string;
}

interface ResultadoNominatim {
  lat: string;
  lon: string;
  display_name: string;
  address?: DireccionNominatim;
}

function extraerCiudad(address: DireccionNominatim): string {
  return address.city ?? address.town ?? address.village ?? address.municipality ?? '';
}

function extraerDireccion(address: DireccionNominatim): string {
  return [address.house_number, address.road].filter(Boolean).join(' ');
}

/**
 * Busca una dirección o ciudad en OpenStreetMap vía Nominatim.
 * Acotada a Colombia (`countrycodes=co`). Acepta un `AbortSignal` para cancelar
 * peticiones obsoletas desde el componente (debounce).
 */
export async function buscarDireccion(
  consulta: string,
  signal?: AbortSignal
): Promise<ResultadoGeocodificacion[]> {
  if (!consulta.trim()) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'co',
    'accept-language': 'es',
    q: consulta.trim(),
  });

  const respuesta = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!respuesta.ok) {
    throw new Error('Error al consultar el servicio de geocodificación');
  }

  const resultados: ResultadoNominatim[] = await respuesta.json();

  return resultados.map((r) => {
    const address = r.address ?? {};
    return {
      lat: Number(r.lat),
      lng: Number(r.lon),
      displayName: r.display_name,
      direccion: extraerDireccion(address),
      ciudad: extraerCiudad(address),
      departamento: address.state ?? '',
    };
  });
}
```

- [ ] **Step 2: Verificar compilación**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: 0 errores (archivo nuevo, no afecta a nadie todavía).

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/utils/geocodificacion.ts
git commit -m "feat(frontend): utilidad de geocodificacion con Nominatim"
```

---

### Task 2: Componente compartido `BuscadorDireccion`

**Files:**
- Create: `packages/frontend/src/components/BuscadorDireccion.tsx`

**Interfaces:**
- Consumes (de Task 1): `buscarDireccion`, `ResultadoGeocodificacion` (importados como `../utils/geocodificacion`).
- Produces (lo que usan Task 4 y 5): componente `BuscadorDireccion` con props
  `{ onSeleccionar: (resultado: ResultadoGeocodificacion) => void; placeholder?: string }`.
  Debe renderizarse como hijo de `MapContainer` (usa `useMap()` para el `flyTo`).

- [ ] **Step 1: Crear `src/components/BuscadorDireccion.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import { useMap } from 'react-leaflet'
import { buscarDireccion, ResultadoGeocodificacion } from '../utils/geocodificacion'

export interface BuscadorDireccionProps {
  onSeleccionar: (resultado: ResultadoGeocodificacion) => void
  placeholder?: string
}

/**
 * Buscador de direcciones estilo Google Maps sobre el mapa. Debounce de 400 ms,
 * resultados de Nominatim (Colombia), flyTo automático al seleccionar y callback
 * para que el padre (dashboard o modal) procese la ubicación elegida.
 */
export function BuscadorDireccion({
  onSeleccionar,
  placeholder = 'Buscar dirección o ciudad...',
}: BuscadorDireccionProps) {
  const map = useMap()
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<ResultadoGeocodificacion[]>([])
  const [abierto, setAbierto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (consulta.trim().length < 3) {
      setResultados([])
      setError(null)
      setAbierto(false)
      setBuscando(false)
      return
    }

    abortRef.current?.abort()
    const controlador = new AbortController()
    abortRef.current = controlador
    setBuscando(true)
    setError(null)

    const temporizador = setTimeout(async () => {
      try {
        const r = await buscarDireccion(consulta, controlador.signal)
        setResultados(r)
        setAbierto(true)
      } catch {
        if (!controlador.signal.aborted) {
          setError('No se pudo buscar. Intenta de nuevo.')
        }
      } finally {
        if (!controlador.signal.aborted) setBuscando(false)
      }
    }, 400)

    return () => {
      clearTimeout(temporizador)
      controlador.abort()
    }
  }, [consulta])

  function seleccionar(resultado: ResultadoGeocodificacion) {
    map.flyTo([resultado.lat, resultado.lng], 15, { duration: 0.8 })
    onSeleccionar(resultado)
    setAbierto(false)
    setConsulta('')
    setResultados([])
  }

  return (
    <div className="absolute right-3 top-3 z-[1000] w-72">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mm-gray-400" />
        <input
          className="input-dark pl-9 pr-8"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          onFocus={() => {
            if (resultados.length > 0) setAbierto(true)
          }}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {consulta && (
          <button
            type="button"
            onClick={() => {
              setConsulta('')
              setResultados([])
              setAbierto(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-mm-gray-400 transition-colors hover:text-white"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {buscando && (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-mm-gray-600 bg-mm-gray-900 px-3 py-2 text-sm text-mm-gray-300 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
          Buscando...
        </div>
      )}

      {error && (
        <div className="mt-1 rounded-lg border border-mm-error/40 bg-mm-gray-900 px-3 py-2 text-sm text-mm-error shadow-lg">
          {error}
        </div>
      )}

      {abierto && resultados.length === 0 && !buscando && !error && (
        <div className="mt-1 rounded-lg border border-mm-gray-600 bg-mm-gray-900 px-3 py-2 text-sm text-mm-gray-300 shadow-lg">
          Sin resultados para &quot;{consulta}&quot;.
        </div>
      )}

      {abierto && resultados.length > 0 && (
        <ul className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-mm-gray-600 bg-mm-gray-900 shadow-lg">
          {resultados.map((resultado, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => seleccionar(resultado)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-mm-gray-200 transition-colors hover:bg-mm-gray-800"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mm-yellow" />
                <span className="line-clamp-2">{resultado.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BuscadorDireccion
```

- [ ] **Step 2: Verificar compilación**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: 0 errores (componente sin consumidores todavía).

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/components/BuscadorDireccion.tsx
git commit -m "feat(frontend): buscador de direcciones sobre el mapa (Nominatim)"
```

---

### Task 3: Pines SVG corporativos por estado

**Files:**
- Modify: `packages/frontend/src/components/MapaConcesionarios.tsx:8-17` (reemplazar `iconoConcesionario` y su helper)
- Modify: `packages/frontend/src/styles/index.css:138-177` (sustituir `.mm-pin*` por el nuevo wrapper SVG)

**Interfaces:**
- Consumes: nada nuevo. Usa `EstadoOperativo` y `L` (ya importados).
- Produces: `iconoConcesionario(estado: EstadoOperativo): L.DivIcon` con SVG inline (misma firma que antes, para que Task 5 no cambie llamadas).

> **Nota para este archivo:** las referencias de línea de `MapaConcesionarios.tsx` en esta tarea corresponden al estado tras aplicar Task 3 (los números se desplazaron); anclar siempre por contenido con los bloques mostrados.

- [ ] **Step 1: Reemplazar `iconoConcesionario` en `MapaConcesionarios.tsx`**

Sustituir TODO el bloque actual (desde el comentario `/** Crea el icono... */` hasta el cierre de la función `iconoConcesionario`) por:

```tsx
const COLORES_PIN: Record<EstadoOperativo, { relleno: string; borde: string; punto: string; check?: boolean }> = {
  activo: { relleno: '#FFCC00', borde: '#000000', punto: '#FFFFFF' },
  inactivo: { relleno: '#A3A3A3', borde: '#000000', punto: '#FFFFFF' },
  proximo: { relleno: '#FFFFFF', borde: '#FFCC00', punto: '#000000' },
  en_ejecucion: { relleno: '#F59E0B', borde: '#000000', punto: '#FFFFFF' },
  completado: { relleno: '#10B981', borde: '#000000', punto: '#FFFFFF', check: true },
}

/** SVG del pin teardrop corporativo (negro/amarillo/blanco + acento por estado). */
function svgPin(estado: EstadoOperativo): string {
  const colores = COLORES_PIN[estado]
  const interior = colores.check
    ? '<path d="M13 17.3 l2.6 2.6 l5.2 -5.8" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
    : `<circle cx="17" cy="17" r="5.5" fill="${colores.punto}"/>`
  return [
    '<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">',
    `<path d="M17 1 C8.72 1 2 7.72 2 16 C2 27 17 43 17 43 C17 43 32 27 32 16 C32 7.72 25.28 1 17 1 Z" fill="${colores.relleno}" stroke="${colores.borde}" stroke-width="2.5"/>`,
    interior,
    '</svg>',
  ].join('')
}

/** Crea el icono personalizado (pin SVG) con la identidad de Mundo Motos. */
export function iconoConcesionario(estado: EstadoOperativo): L.DivIcon {
  return L.divIcon({
    className: 'mm-pin-wrapper mm-pin-svg',
    html: svgPin(estado),
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  })
}
```

- [ ] **Step 2: Actualizar `src/styles/index.css`**

Reemplazar el bloque completo "Mapa / Leaflet" de los pines (líneas 138-177: `.mm-pin-wrapper`, `.mm-pin`, `.mm-pin:hover`, `.mm-pin-activo`, `.mm-pin-inactivo`, `.mm-pin-proximo`, `.mm-pin-en_ejecucion`, `.mm-pin-completado`) por:

```css
.mm-pin-wrapper {
  background: transparent;
  border: none;
}

.mm-pin-svg {
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
  cursor: pointer;
  transition: transform 0.15s ease;
}

.mm-pin-svg:hover {
  transform: scale(1.15);
  transform-origin: bottom center;
}

.mm-pin-svg svg {
  display: block;
}
```

- [ ] **Step 3: Verificar compilación**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/MapaConcesionarios.tsx packages/frontend/src/styles/index.css
git commit -m "feat(frontend): pines SVG corporativos por estado operativo"
```

---

### Task 4: Popups enriquecidos, botón "Centrar mapa" y buscador en `MapaConcesionarios` + wiring en Dashboard

**Files:**
- Modify: `packages/frontend/src/components/MapaConcesionarios.tsx` (imports, `BotonCentrarMapa`, `BotonPopup`, props, popup, render del buscador)
- Modify: `packages/frontend/src/components/DashboardConcesionarios.tsx:160-164` (pasar `onEditar`/`onGestionar` al mapa)
- Modify: `packages/frontend/src/styles/index.css` (estilos `.popup-boton*`)

**Interfaces:**
- Consumes: `BuscadorDireccion` (Task 2, vía `@components/BuscadorDireccion`), `ResultadoGeocodificacion` (vía `@utils/geocodificacion`), `LocateFixed` de lucide-react.
- Produces: `MapaConcesionarios` con props nuevas opcionales `onEditar?: (c: Concesionario) => void`, `onGestionar?: (c: Concesionario) => void`, `onBuscarDireccion?: (r: ResultadoGeocodificacion) => void`. El popup muestra badge, contacto y botones que cierran el popup y llaman al callback. `BotonCentrarMapa` (interno) recentra a toda la red con `flyToBounds`.

- [ ] **Step 1: Actualizar imports y constantes en `MapaConcesionarios.tsx`**

En la cabecera, reemplazar el bloque de imports del archivo por:

```tsx
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import L from 'leaflet'
import { BuscadorDireccion } from '@components/BuscadorDireccion'
import { ResultadoGeocodificacion } from '@utils/geocodificacion'
import { Concesionario, Coordenadas, EstadoOperativo } from '../types/concesionario'
```

Justo después de `const CENTRO_COLOMBIA: [number, number] = [4.60971, -74.08175]`, añadir:

```tsx
const ESTADO_LABEL: Record<EstadoOperativo, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  proximo: 'Próximo',
  en_ejecucion: 'En ejecución',
  completado: 'Completado',
}
```

- [ ] **Step 2: Añadir `BotonCentrarMapa` y `BotonPopup` (componentes internos)**

Después de la función `ClicUbicacion` (bloque `function ClicUbicacion ... return null }`) y antes de `export interface MapaConcesionariosProps`, insertar:

```tsx
/** Botón flotante para recentrar la vista en toda la red de concesionarios. */
function BotonCentrarMapa({ concesionarios }: { concesionarios: Concesionario[] }) {
  const map = useMap()
  return (
    <button
      type="button"
      onClick={() => {
        if (concesionarios.length === 0) {
          map.setView(CENTRO_COLOMBIA, 5)
          return
        }
        const bounds = L.latLngBounds(
          concesionarios.map((c) => [c.latitud, c.longitud] as [number, number])
        )
        map.flyToBounds(bounds, { padding: [48, 48], duration: 0.6 })
      }}
      className="absolute left-2 top-12 z-[1000] rounded-lg border border-mm-gray-600 bg-mm-gray-800 p-2 text-mm-yellow shadow-lg transition-colors hover:bg-mm-gray-700"
      title="Centrar mapa en todos los concesionarios"
      aria-label="Centrar mapa"
    >
      <LocateFixed className="h-5 w-5" />
    </button>
  )
}

/** Botón de acción dentro del popup: cierra el popup y ejecuta la acción. */
function BotonPopup({
  etiqueta,
  primario,
  onClic,
}: {
  etiqueta: string
  primario?: boolean
  onClic: () => void
}) {
  const map = useMap()
  return (
    <button
      type="button"
      onClick={() => {
        map.closePopup()
        onClic()
      }}
      className={`popup-boton ${primario ? 'popup-boton-primario' : 'popup-boton-secundario'}`}
    >
      {etiqueta}
    </button>
  )
}
```

- [ ] **Step 3: Ampliar `MapaConcesionariosProps` y el render del componente**

Sustituir la interfaz `MapaConcesionariosProps` (bloque `export interface MapaConcesionariosProps { ... }`) por:

```tsx
export interface MapaConcesionariosProps {
  concesionarios: Concesionario[]
  seleccionado?: Concesionario | null
  onSeleccionar?: (concesionario: Concesionario) => void
  modoSeleccionUbicacion?: boolean
  ubicacionSeleccionada?: Coordenadas | null
  onClicUbicacion?: (lat: number, lng: number) => void
  onEditar?: (concesionario: Concesionario) => void
  onGestionar?: (concesionario: Concesionario) => void
  onBuscarDireccion?: (resultado: ResultadoGeocodificacion) => void
}
```

Sustituir la firma del componente (bloque `export function MapaConcesionarios({ ... }: MapaConcesionariosProps) {`) por:

```tsx
export function MapaConcesionarios({
  concesionarios,
  seleccionado = null,
  onSeleccionar,
  modoSeleccionUbicacion = false,
  ubicacionSeleccionada = null,
  onClicUbicacion,
  onEditar,
  onGestionar,
  onBuscarDireccion,
}: MapaConcesionariosProps) {
```

Sustituir el cuerpo del `return` (todo lo que hay entre `return (` y el cierre `}` del componente) por:

```tsx
  return (
    <MapContainer center={CENTRO_COLOMBIA} zoom={5} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BuscadorDireccion onSeleccionar={onBuscarDireccion ?? (() => undefined)} />
      {modoSeleccionUbicacion ? (
        <>
          <ClicUbicacion onClic={onClicUbicacion ?? (() => undefined)} />
          {ubicacionSeleccionada && (
            <Marker
              position={[ubicacionSeleccionada.lat, ubicacionSeleccionada.lng]}
              icon={iconoConcesionario('activo')}
            >
              <Popup>Ubicación seleccionada</Popup>
            </Marker>
          )}
        </>
      ) : (
        <>
          {concesionarios.map((concesionario) => (
            <Marker
              key={concesionario.id}
              position={[concesionario.latitud, concesionario.longitud]}
              icon={iconoConcesionario(concesionario.estado)}
              eventHandlers={{
                click: () => onSeleccionar?.(concesionario),
              }}
            >
              <Popup>
                <div className="popup-concesionario">
                  <div className="popup-concesionario-badges">
                    <span className={`badge-estado ${concesionario.estado}`}>
                      {ESTADO_LABEL[concesionario.estado]}
                    </span>
                  </div>
                  <h3 className="popup-concesionario-titulo">{concesionario.nombre}</h3>
                  <p className="popup-concesionario-texto">Código: {concesionario.nit}</p>
                  <p className="popup-concesionario-texto">
                    {concesionario.ciudad} · {concesionario.departamento}
                  </p>
                  <p className="popup-concesionario-texto">{concesionario.direccion}</p>
                  {concesionario.telefono && (
                    <p className="popup-concesionario-texto">{concesionario.telefono}</p>
                  )}
                  <p className="popup-concesionario-texto">{concesionario.email}</p>
                  <div className="popup-concesionario-acciones">
                    <BotonPopup etiqueta="Editar" primario onClic={() => onEditar?.(concesionario)} />
                    <BotonPopup etiqueta="Gestionar" onClic={() => onGestionar?.(concesionario)} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          <AjustarVista concesionarios={concesionarios} seleccionado={seleccionado} />
          <BotonCentrarMapa concesionarios={concesionarios} />
        </>
      )}
    </MapContainer>
  )
}
```

- [ ] **Step 4: Añadir estilos de los botones del popup en `src/styles/index.css`**

Después de la regla `.popup-concesionario-texto { ... }` y antes de `.badge-estado`, insertar:

```css
.popup-concesionario-acciones {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

.popup-boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.popup-boton-primario {
  background: #ffcc00;
  color: #000000;
  border: 1px solid #ffcc00;
}

.popup-boton-primario:hover {
  background: #e6b800;
}

.popup-boton-secundario {
  background: transparent;
  color: #ffcc00;
  border: 1px solid #ffcc00;
}

.popup-boton-secundario:hover {
  background: rgba(255, 204, 0, 0.15);
}
```

- [ ] **Step 5: Conectar callbacks en `DashboardConcesionarios.tsx`**

En el uso de `<MapaConcesionarios>` (líneas 160-164), añadir las dos props:

```tsx
          <MapaConcesionarios
            concesionarios={concesionarios}
            seleccionado={seleccionado}
            onSeleccionar={seleccionar}
            onEditar={abrirEdicion}
            onGestionar={(c) => setDetalle(c)}
          />
```

`abrirEdicion` ya existe (abre el modal de edición y cierra el detalle); `onGestionar` abre el `DetalleConcesionarioModal` reutilizando la función local.

- [ ] **Step 6: Verificar compilación**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: 0 errores.

- [ ] **Step 7: Commit**

```bash
git add packages/frontend/src/components/MapaConcesionarios.tsx packages/frontend/src/components/DashboardConcesionarios.tsx packages/frontend/src/styles/index.css
git commit -m "feat(frontend): popups enriquecidos, boton centrar mapa y buscador en dashboard"
```

---

### Task 5: Modal de concesionario — marcador arrastrable, flyTo, buscador y autocompletado

**Files:**
- Modify: `packages/frontend/src/components/ConcesionarioModal.tsx` (imports, `VolarAUbicacion`, `arrastrandoRef`, z-index, mini-mapa, `manejarResultadoBuscador`)

**Interfaces:**
- Consumes: `BuscadorDireccion` (Task 2), `ResultadoGeocodificacion` (Task 1), `iconoConcesionario` (Task 3), `Coordenadas` (ya existe en `../types/concesionario`), `useMap` de react-leaflet.
- Produces: nada nuevo; el modal queda con marcador `draggable`, búsqueda y autocompletado.

- [ ] **Step 1: Actualizar imports**

Sustituir el bloque de imports de la cabecera (primeras 7 líneas) por:

```tsx
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { MapPin, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiService } from '@services/api'
import { BuscadorDireccion } from '@components/BuscadorDireccion'
import { ResultadoGeocodificacion } from '@utils/geocodificacion'
import { iconoConcesionario } from '@components/MapaConcesionarios'
import { Concesionario, Coordenadas, EstadoOperativo, TipoExpansion } from '../types/concesionario'
```

- [ ] **Step 2: Añadir el componente `VolarAUbicacion`**

Después de la función `ClicUbicacion` (bloque `function ClicUbicacion ... return null }`) y antes de `export interface ConcesionarioModalProps`, insertar:

```tsx
/** Vuela el mini-mapa a la ubicación actual; se omite durante el arrastre del marcador. */
function VolarAUbicacion({
  ubicacion,
  arrastrandoRef,
}: {
  ubicacion: Coordenadas | null
  arrastrandoRef: { current: boolean }
}) {
  const map = useMap()
  useEffect(() => {
    if (ubicacion && !arrastrandoRef.current) {
      map.flyTo([ubicacion.lat, ubicacion.lng], 15, { duration: 0.8 })
    }
  }, [ubicacion, arrastrandoRef, map])
  return null
}
```

- [ ] **Step 3: Añadir el ref de arrastre en el componente principal**

Dentro de `ConcesionarioModal`, justo antes de la línea `const [enviando, setEnviando] = useState(false)`, insertar:

```tsx
  const arrastrandoRef = useRef(false)
```

- [ ] **Step 4: Subir el modal a `z-[1000]`**

Sustituir el `className` del contenedor raíz del modal (`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4`) por:

```tsx
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      onClick={onCerrar}
    >
```

- [ ] **Step 5: Añadir `manejarResultadoBuscador`**

Después de la función `fijarUbicacion` (bloque `function fijarUbicacion(lat, lng) { ... }`) y antes de `manejarEnvio`, insertar:

```tsx
  function manejarResultadoBuscador(resultado: ResultadoGeocodificacion) {
    fijarUbicacion(resultado.lat, resultado.lng)
    if (!form.ciudad.trim()) actualizar('ciudad', resultado.ciudad)
    if (!form.departamento.trim()) actualizar('departamento', resultado.departamento)
    if (!form.direccion.trim()) actualizar('direccion', resultado.direccion)
  }
```

- [ ] **Step 6: Reemplazar el mini-mapa**

Sustituir el bloque del `MapContainer` (desde `<MapContainer` hasta `</MapContainer>` dentro del mini-mapa) por:

```tsx
            <div className="relative z-0 mt-3 h-64 w-full overflow-hidden rounded-lg border border-mm-gray-600">
              <MapContainer
                center={CENTRO_COLOMBIA}
                zoom={5}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <BuscadorDireccion onSeleccionar={manejarResultadoBuscador} />
                <ClicUbicacion onClic={fijarUbicacion} />
                <VolarAUbicacion ubicacion={ubicacion} arrastrandoRef={arrastrandoRef} />
                {ubicacion && (
                  <Marker
                    position={[ubicacion.lat, ubicacion.lng]}
                    icon={iconoConcesionario('activo')}
                    draggable
                    eventHandlers={{
                      dragstart: () => {
                        arrastrandoRef.current = true
                      },
                      drag: (e) =>
                        fijarUbicacion(e.target.getLatLng().lat, e.target.getLatLng().lng),
                      dragend: (e) => {
                        arrastrandoRef.current = false
                        fijarUbicacion(e.target.getLatLng().lat, e.target.getLatLng().lng)
                      },
                    }}
                  />
                )}
              </MapContainer>
            </div>
```

- [ ] **Step 7: Verificar compilación**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: 0 errores.

- [ ] **Step 8: Commit**

```bash
git add packages/frontend/src/components/ConcesionarioModal.tsx
git commit -m "feat(frontend): marcador arrastrable y geocoding en el modal de concesionarios"
```

---

### Task 6: Modales restantes a `z-[1000]`

**Files:**
- Modify: `packages/frontend/src/components/DetalleConcesionarioModal.tsx:26`
- Modify: `packages/frontend/src/components/ConfirmarEliminacionModal.tsx:27`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: todos los modales del flujo de concesionarios por encima de overlays y controles del mapa.

- [ ] **Step 1: `DetalleConcesionarioModal.tsx`**

Sustituir la línea 26:
`className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"`
por:
`className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"`

- [ ] **Step 2: `ConfirmarEliminacionModal.tsx`**

Sustituir la línea 27:
`className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"`
por:
`className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"`

- [ ] **Step 3: Verificar compilación**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/DetalleConcesionarioModal.tsx packages/frontend/src/components/ConfirmarEliminacionModal.tsx
git commit -m "fix(frontend): modales a z-[1000] para que no compitan con overlays del mapa"
```

---

### Task 7: Verificación final

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Type-check completo**

Run (en `packages/frontend`): `npx.cmd tsc --noEmit -p tsconfig.app.json`
Expected: 0 errores.

- [ ] **Step 2: Build completo con purga de marca**

Run (en la raíz del repo): `npm.cmd run build --workspace=@mundo-motos/frontend`
Expected: exitoso. El script ejecuta `tsc --noEmit -p tsconfig.app.json && vite build && node scripts/purge-blue.mjs`. Si queda algún azul/cian o gris azulado, `purge-blue.mjs` **falla el build** con el listado de archivos ofensivos — en ese caso corregir los colores en el código (no en `dist/`) y repetir. Se espera la línea `[purge-blue] OK: ... CERO rastro de azul/cian y grises azulados en dist/.`

- [ ] **Step 3: Revisión visual manual**

Arrancar backend y frontend (`npm.cmd run dev --workspace=@mundo-motos/backend` y `npm.cmd run dev --workspace=@mundo-motos/frontend`) y verificar en el navegador:

1. Buscador en el dashboard: escribir una ciudad (p. ej. "Medellín"), aparece el dropdown, al seleccionar vuela y hace zoom.
2. Buscador en el modal (crear/editar): al seleccionar llena lat/lng, mueve el marcador, y completa ciudad/departamento/dirección solo si están vacíos.
3. Arrastrar el marcador en el modal: los campos lat/lng se actualizan en tiempo real.
4. Popup de un pin: badge de estado, datos de contacto y botones **Editar** (abre `ConcesionarioModal`) y **Gestionar** (abre `DetalleConcesionarioModal`); el popup se cierra al pulsar.
5. Botón "Centrar mapa": con la red cargada, recalcula la vista para abarcar todos los pines; sin datos vuelve a Colombia.
6. Los modales siempre quedan por encima de controles/overlays del mapa.
7. Sin rastro de azul/cian en ninguna interacción (teselas en sepia, pines, popups, badges).
