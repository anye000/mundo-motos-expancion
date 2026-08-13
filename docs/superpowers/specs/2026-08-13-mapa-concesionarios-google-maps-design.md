# Design: Mapa de Concesionarios con interactividad estilo Google Maps

Fecha: 2026-08-13
Estado: Aprobado

## Objetivo

Evolucionar el mapa de concesionarios de Mundo Motos CRM (`MapaConcesionarios.tsx`,
`ConcesionarioModal.tsx`) hacia una experiencia visual e interactiva tipo Google Maps:
buscador de direcciones (geocoding con Nominatim), pines SVG personalizados con la
paleta corporativa, popups de información enriquecida con accesos directos de gestión,
controles de mapa avanzados y capas de z-index correctas (mapa `z-0`, modales `z-[1000]`).
Sin regresiones visuales: **cero azul/cian** (verificado por `scripts/purge-blue.mjs`).

## Decisiones tomadas

- **Pines SVG**: `L.divIcon` con SVG inline parametrizado por estado (patrón ya usado por
  el código actual con `divIcon`). Sin assets estáticos; el `purge-blue.mjs` los procesa
  igual al quedar embebidos en el bundle JS/CSS.
- **Colores de pines**: base Negro `#000000` / Amarillo `#FFCC00` / Blanco `#FFFFFF` con
  acentos semánticos para diferenciar estados (ver tabla en "Pines SVG personalizados").
- **Buscador**: en el mapa principal del dashboard **y** en el mini-mapa del modal de
  creación/edición. Al seleccionar un resultado: `flyTo`/zoom; en el modal además llena
  lat/lng, mueve el marcador y autocompleta ciudad/departamento/dirección **solo si el
  campo está vacío**.
- **Geocoding**: API pública de Nominatim (OpenStreetMap) vía `fetch` con debounce (~400 ms)
  y `AbortController`. Query: `format=jsonv2`, `addressdetails=1`, `limit=5`,
  `countrycodes=co`, `accept-language=es`.
- **Marcador arrastrable**: en el modal de creación/edición, `draggable` con eventos `drag`
  (actualiza lat/lng en tiempo real) y `dragend`. El mini-mapa hace `flyTo` cuando cambian
  las coordenadas (corrige el bug actual: editar un concesionario de otra ciudad muestra el
  mapa centrado en Bogotá).
- **Popups**: estilo dark corporate ya presente (fondo negro, borde amarillo, texto blanco)
  y se enriquece con badge de estado, datos de contacto y botones **Editar** / **Gestionar**
  que abren los modales existentes y cierran el popup.
- **z-index**: contenedores de mapa `relative z-0` (aíslan sus overlays en un stacking
  context propio). Los modales `ConcesionarioModal`, `DetalleConcesionarioModal` y
  `ConfirmarEliminacionModal` suben de `z-50` a `z-[1000]`.

## Arquitectura

```
DashboardConcesionarios (App: ruta /)
  ├── MapaConcesionarios (react-leaflet)
  │     ├── pines SVG (L.divIcon inline, por estado)
  │     ├── BuscadorDireccion (overlay, Nominatim + flyTo)
  │     ├── BotonCentrarMapa (fitBounds a toda la red)
  │     └── Popup enriquecido (badge, contacto, Editar/Gestionar)
  ├── ConcesionarioModal (mini-mapa)
  │     ├── BuscadorDireccion (llena lat/lng + autocompleta campos vacíos)
  │     └── Marker draggable (drag → lat/lng en tiempo real)
  ├── DetalleConcesionarioModal (z-[1000])
  └── ConfirmarEliminacionModal (z-[1000])
```

### Archivos

1. **`src/utils/geocodificacion.ts`** (nuevo): tipos `ResultadoGeocodificacion`,
   `DireccionNominatim` y función `buscarDireccion(consulta, signal)` que hace la petición a
   Nominatim y normaliza el resultado a `{ lat, lng, displayName, direccion, ciudad,
   departamento }`.

2. **`src/components/BuscadorDireccion.tsx`** (nuevo, compartido):
   - Input overlay posicionado en la esquina superior derecha del mapa
     (`absolute top-3 right-3 z-[1000]`), estilo dark corporate (`input-dark`).
   - Debounce 400 ms, `AbortController` para cancelar peticiones viejas.
   - Dropdown de hasta 5 resultados con `display_name`; selección → `flyTo` (zoom 15)
     + callback `onSeleccionar(resultado)`.
   - Estado de "buscando..." (spinner pequeño) y manejo de error silencioso (sin romper).
   - Props: `onSeleccionar: (r: ResultadoGeocodificacion) => void`, `placeholder?: string`.
   - Se renderiza como hijo de `MapContainer` para usar `useMap()`.

3. **`src/components/MapaConcesionarios.tsx`** (modificar):
   - `iconoConcesionario(estado)` pasa a devolver `L.divIcon` con el **SVG inline** del pin
     corporativo (ver sección Pines).
   - Nuevo overlay `BotonCentrarMapa` (componente interno, usa `useMap()`): botón flotante
     estilo Leaflet (`top-12 left-2`, cuadrado, `bg-mm-gray-800 border border-mm-gray-600`,
     icono `LocateFixed` de lucide). Al hacer clic: `fitBounds` a todos los concesionarios
     con padding, o `setView(CENTRO_COLOMBIA, 5)` si no hay ninguno.
   - Renderiza `<BuscadorDireccion>` dentro del `MapContainer` (tanto en modo lista como en
     modo selección de ubicación).
   - Popup enriquecido (ver sección Popups) con botones que invocan `onEditar`/`onGestionar`.
   - Nuevas props opcionales: `onEditar?: (c: Concesionario) => void`,
     `onGestionar?: (c: Concesionario) => void`.
   - La prop `onSeleccionar` sigue activando el vuelo al seleccionado (comportamiento actual).

4. **`src/components/ConcesionarioModal.tsx`** (modificar):
   - Modal de `z-50` → `z-[1000]`.
   - Mini-mapa: `<Marker draggable>` con `eventHandlers.drag` (llama `fijarUbicacion` en
     tiempo real) y `eventHandlers.dragend`.
   - Componente interno `VolarAUbicacion` (usa `useMap()`): `useEffect` que hace `flyTo` a
     `ubicacion` cuando cambia (evita el centro fijo en Bogotá). El efecto se omite mientras
     el marcador está siendo arrastrado (flag en una `ref` activada en `dragstart` y
     desactivada en `dragend`) para que el mapa no persiga al marcador durante el arrastre.
   - `<BuscadorDireccion onSeleccionar={...}>` dentro del mini-mapa: llena lat/lng, mueve el
     marcador, autocompleta `ciudad`, `departamento`, `direccion` solo si están vacíos.
   - `zoomControl={false}` no cambia; se mantienen los controles Leaflet por defecto.

5. **`src/components/DashboardConcesionarios.tsx`** (modificar):
   - Pasa `onEditar` (abre `ConcesionarioModal` en modo edición, cierra detalle) y
     `onGestionar` (abre `DetalleConcesionarioModal`) a `MapaConcesionarios`.
   - El overlay de "Cargando concesionarios..." conserva `z-[1000]` interno (dentro del
     stacking context `z-0` del contenedor del mapa, nunca tapa modales).

6. **`src/components/DetalleConcesionarioModal.tsx`** (modificar): `z-50` → `z-[1000]`.

7. **`src/components/ConfirmarEliminacionModal.tsx`** (modificar): `z-50` → `z-[1000]`.

8. **`src/styles/index.css`** (modificar):
   - Eliminar las reglas obsoletas `.mm-pin-wrapper`, `.mm-pin`, `.mm-pin-*` (reemplazadas
     por el SVG inline) y sustituirlas por `.mm-pin-svg` (wrapper transparente) con hover
     `scale(1.15)`.
   - Estilos del dropdown de resultados del buscador y de los botones de acción del popup
     (clases utilitarias `.popup-concesionario-*`, botones `.popup-boton-*`).
   - Mantener el bloque de purga de marca y el `filter: grayscale(1) sepia(1)` de las teselas.

## Pines SVG personalizados

Forma teardrop clásica de ubicación con silueta negra `#000000`, relleno variable, punto
central y sombra sutil (`<feDropShadow>`). Tamaño 34×44, `iconAnchor [17, 42]`,
`popupAnchor [0, -38]`. El SVG se genera con un template string parametrizado por estado
(relleno, color de borde, color/forma del punto central).

| Estado        | Relleno cuerpo | Borde       | Punto central      | Acento semántico |
|---------------|----------------|-------------|--------------------|------------------|
| `activo`      | `#FFCC00`      | `#000000`   | Blanco `#FFFFFF`   | Amarillo          |
| `inactivo`    | `#A3A3A3`      | `#000000`   | Blanco `#FFFFFF`   | Gris neutro       |
| `proximo`     | `#FFFFFF`      | `#FFCC00`   | Negro `#000000`    | Blanco + amarillo |
| `en_ejecucion`| `#F59E0B`      | `#000000`   | Blanco `#FFFFFF`   | Ámbar             |
| `completado`  | `#10B981`      | `#000000`   | Blanco con check   | Verde             |

Cero azul/cian: los tonos de acento son los mismos ya usados por los badges del CRM
(`mm-success`, `mm-warning`, gris `mm-gray-400`), que no aparecen en la lista de bloqueo
de `purge-blue.mjs`.

## Popups enriquecidos

Markup del popup en modo lista (mantiene el estilo dark existente en
`.leaflet-popup-content-wrapper`):

- Badge de estado operativo (clases `badge-estado` ya existentes).
- Nombre en amarillo (`.popup-concesionario-titulo`).
- Código (NIT) y ciudad · departamento.
- Dirección, teléfono y email (`.popup-concesionario-texto`).
- Fila de acciones con dos botones:
  - **Editar** (botón primario: `bg-mm-yellow` texto negro) → `onEditar(concesionario)`.
  - **Gestionar** (botón outline) → `onGestionar(concesionario)`.
- Tras pulsar cualquiera, se cierra el popup (componente hijo que usa `useMap()` y llama
  `map.closePopup()`).

Los botones se estilan con CSS en `index.css` (`.popup-boton`, `.popup-boton-primario`,
`.popup-boton-secundario`) porque el contenido del popup de Leaflet no está en el árbol
de Tailwind del build (es un portal propio).

## Controles y z-index

| Elemento                                   | Clase / valor                          | Efecto |
|--------------------------------------------|----------------------------------------|--------|
| Contenedor del mapa (dashboard y modal)    | `relative z-0`                         | Crea stacking context; overlays internos nunca tapan modales |
| Buscador de direcciones (overlay)          | `absolute z-[1000]` (dentro del mapa)  | Sobre teselas, controles y popups; confinado al contexto `z-0` |
| Botón "Centrar mapa" (overlay)             | `absolute z-[1000]` (dentro del mapa)  | Ídem |
| Overlay "Cargando concesionarios..."       | `absolute z-[1000]` (dentro del mapa)  | Ídem (sin cambio) |
| Modales (Concesionario / Detalle / Confirmar) | `fixed inset-0 z-[1000]`            | Sobre todo el mapa y sus overlays |

Los `z-[1000]` internos del mapa no compiten con los modales: al vivir dentro del contenedor
`relative z-0`, su índice efectivo en el contexto raíz es 0, muy por debajo del `fixed
z-[1000]` de los modales.

## Flujo de datos

1. `BuscadorDireccion` (debounce 400 ms) → `fetch` a Nominatim → dropdown con resultados.
2. Selección → `flyTo(lat, lng, 15)` + `onSeleccionar({ lat, lng, displayName, direccion,
   ciudad, departamento })`.
3. En el modal: `fijarUbicacion(lat, lng)` + `actualizar` de campos vacíos → el marcador
   draggable se reposiciona y el mini-mapa vuela a la ubicación.
4. En el dashboard: el vuelo es navegación pura; la selección de un pin sigue abriendo el
   detalle (`onSeleccionar`).

## Manejo de errores

- Nominatim: peticiones canceladas por `AbortController` se ignoran (no rompen el estado);
  si la petición falla, se muestra un mensaje breve en el dropdown ("No se pudo buscar. 
  Intenta de nuevo.") sin lanzar excepciones.
- Sin resultados: "Sin resultados para '<consulta>'".
- El resto del flujo reutiliza los estados de error/loading existentes del dashboard y del
  modal (toasts).

## Verificación

1. `npx.cmd tsc --noEmit -p packages/frontend/tsconfig.app.json` → 0 errores.
2. `npm.cmd run build --workspace=@mundo-motos/frontend` → build exitoso incluyendo
   `scripts/purge-blue.mjs` (falla si queda azul/cian o gris azulado en `dist/`).
3. Revisión visual manual en `npm.cmd run dev --workspace=@mundo-motos/frontend`:
   - Buscador vuela a la dirección y llena lat/lng en el modal.
   - Arrastrar el marcador actualiza lat/lng en tiempo real.
   - Popup muestra badge, contacto y botones Editar/Gestionar que abren sus modales.
   - "Centrar mapa" recalcula la vista a toda la red.
   - Los modales siempre quedan por encima de overlays y controles del mapa.

## Fuera de alcance

- Reverse geocoding al arrastrar (autocompletar dirección desde coordenadas).
- Control de zoom personalizado (se mantiene el de Leaflet).
- Resultados de búsqueda >5 o paginación de Nominatim.
- Eliminación del sistema `purge-blue.mjs`.
- Cambios en el backend.
