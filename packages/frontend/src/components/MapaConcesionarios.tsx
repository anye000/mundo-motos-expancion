import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import L from 'leaflet'
import { BuscadorDireccion } from '@components/BuscadorDireccion'
import { ResultadoGeocodificacion, BOUNDS_VENEZUELA, CENTRO_VENEZUELA } from '@utils/geocodificacion'
import { Concesionario, Coordenadas, EstadoOperativo } from '../types/concesionario'
import { ESTADO_LABEL } from '@utils/estadosConcesionario'

const COLORES_PIN: Record<
  EstadoOperativo,
  { relleno: string; borde: string; punto: string; check?: boolean }
> = {
  en_negociacion: { relleno: '#FFCC00', borde: '#000000', punto: '#000000' },
  proximo: { relleno: '#FFFFFF', borde: '#FFCC00', punto: '#000000' },
  en_ejecucion: { relleno: '#F59E0B', borde: '#000000', punto: '#FFFFFF' },
  activo: { relleno: '#FFCC00', borde: '#000000', punto: '#FFFFFF' },
  inactivo: { relleno: '#A3A3A3', borde: '#000000', punto: '#FFFFFF' },
  rechazado: { relleno: '#A3A3A3', borde: '#000000', punto: '#EF4444' },
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

/** Ajusta la vista del mapa a los concesionarios o vuela al seleccionado. */
function AjustarVista({
  concesionarios,
  seleccionado,
}: {
  concesionarios: Concesionario[]
  seleccionado: Concesionario | null
}) {
  const map = useMap()

  useEffect(() => {
    if (seleccionado) {
      map.flyTo([seleccionado.latitud, seleccionado.longitud], 13, { duration: 0.8 })
      return
    }
    if (concesionarios.length > 0) {
      const bounds = L.latLngBounds(
        concesionarios.map((c) => [c.latitud, c.longitud] as [number, number])
      )
      map.fitBounds(bounds, { padding: [48, 48] })
    } else {
      map.setView(CENTRO_VENEZUELA, 5)
    }
  }, [concesionarios, seleccionado, map])

  return null
}

/** Captura clics en el mapa para seleccionar una ubicación. */
function ClicUbicacion({ onClic }: { onClic: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClic(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Ajusta la vista del mapa a los concesionarios o vuela al seleccionado. */
function BotonCentrarMapa({ concesionarios }: { concesionarios: Concesionario[] }) {
  const map = useMap()

  function centrar() {
    if (concesionarios.length === 0) {
      map.setView(CENTRO_VENEZUELA, 5)
      return
    }
    const bounds = L.latLngBounds(
      concesionarios.map((c) => [c.latitud, c.longitud] as [number, number])
    )
    map.flyToBounds(bounds, { padding: [48, 48], duration: 0.6 })
  }

  return (
    <div className="absolute left-2 top-12 z-[1000]">
      <button
        type="button"
        onClick={centrar}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-mm-gray-600 bg-mm-gray-900 text-mm-gray-300 shadow-md transition-colors hover:text-mm-yellow"
        title="Centrar mapa"
        aria-label="Centrar mapa"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Botón de acción dentro de los popups de concesionarios. */
function BotonPopup({
  onClick,
  variante,
  children,
}: {
  onClick: () => void
  variante: 'primario' | 'secundario'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`popup-boton popup-boton-${variante}`}
    >
      {children}
    </button>
  )
}

/** Acciones de popup: cierra el popup actual y delega en el padre. */
function AccionesPopup({
  concesionario,
  onEditar,
  onGestionar,
}: {
  concesionario: Concesionario
  onEditar?: (concesionario: Concesionario) => void
  onGestionar?: (concesionario: Concesionario) => void
}) {
  const map = useMap()

  return (
    <div className="popup-concesionario-acciones">
      <BotonPopup
        variante="primario"
        onClick={() => {
          map.closePopup()
          onEditar?.(concesionario)
        }}
      >
        Editar
      </BotonPopup>
      <BotonPopup
        variante="secundario"
        onClick={() => {
          map.closePopup()
          onGestionar?.(concesionario)
        }}
      >
        Gestionar
      </BotonPopup>
    </div>
  )
}

export interface MapaConcesionariosProps {
  concesionarios: Concesionario[]
  seleccionado?: Concesionario | null
  onSeleccionar?: (concesionario: Concesionario) => void
  onEditar?: (concesionario: Concesionario) => void
  onGestionar?: (concesionario: Concesionario) => void
  onBuscarDireccion?: (resultado: ResultadoGeocodificacion) => void
  modoSeleccionUbicacion?: boolean
  ubicacionSeleccionada?: Coordenadas | null
  onClicUbicacion?: (lat: number, lng: number) => void
}

export function MapaConcesionarios({
  concesionarios,
  seleccionado = null,
  onSeleccionar,
  onEditar,
  onGestionar,
  onBuscarDireccion,
  modoSeleccionUbicacion = false,
  ubicacionSeleccionada = null,
  onClicUbicacion,
}: MapaConcesionariosProps) {
  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer
        center={CENTRO_VENEZUELA}
        zoom={5}
        scrollWheelZoom={false}
        maxBounds={BOUNDS_VENEZUELA}
        maxBoundsViscosity={0.8}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
            <BuscadorDireccion onSeleccionar={onBuscarDireccion ?? (() => undefined)} />
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
                     <p className="popup-concesionario-texto">RIF: {concesionario.rif}</p>
                    <p className="popup-concesionario-texto">
                      {concesionario.ciudad} · {concesionario.departamento}
                    </p>
                    <p className="popup-concesionario-texto">{concesionario.direccion}</p>
                    {concesionario.telefono && (
                      <p className="popup-concesionario-texto">{concesionario.telefono}</p>
                    )}
                    <p className="popup-concesionario-texto">{concesionario.email}</p>
                    <AccionesPopup
                      concesionario={concesionario}
                      onEditar={onEditar}
                      onGestionar={onGestionar}
                    />
                  </div>
                </Popup>
              </Marker>
            ))}
            <BuscadorDireccion onSeleccionar={onBuscarDireccion ?? (() => undefined)} />
            <BotonCentrarMapa concesionarios={concesionarios} />
            <AjustarVista concesionarios={concesionarios} seleccionado={seleccionado} />
          </>
        )}
      </MapContainer>
    </div>
  )
}

export default MapaConcesionarios
