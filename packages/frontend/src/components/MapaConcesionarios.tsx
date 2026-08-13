import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Concesionario, Coordenadas, EstadoOperativo } from '../types/concesionario'

const CENTRO_COLOMBIA: [number, number] = [4.60971, -74.08175]

/** Crea el icono personalizado (pin) con la identidad de Mundo Motos. */
export function iconoConcesionario(estado: EstadoOperativo): L.DivIcon {
  const activo = estado === 'activo'
  return L.divIcon({
    className: 'mm-pin-wrapper',
    html: `<div class="mm-pin ${activo ? 'mm-pin-activo' : 'mm-pin-inactivo'}"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
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
      map.setView(CENTRO_COLOMBIA, 5)
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

export interface MapaConcesionariosProps {
  concesionarios: Concesionario[]
  seleccionado?: Concesionario | null
  onSeleccionar?: (concesionario: Concesionario) => void
  modoSeleccionUbicacion?: boolean
  ubicacionSeleccionada?: Coordenadas | null
  onClicUbicacion?: (lat: number, lng: number) => void
}

export function MapaConcesionarios({
  concesionarios,
  seleccionado = null,
  onSeleccionar,
  modoSeleccionUbicacion = false,
  ubicacionSeleccionada = null,
  onClicUbicacion,
}: MapaConcesionariosProps) {
  return (
    <MapContainer center={CENTRO_COLOMBIA} zoom={5} scrollWheelZoom={false} className="h-full w-full">
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
                <div>
                  <div className="popup-concesionario-badges">
                    <span className={`badge-estado ${concesionario.estado}`}>
                      {concesionario.estado === 'activo' ? 'Activo' : 'Inactivo'}
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
                </div>
              </Popup>
            </Marker>
          ))}
          <AjustarVista concesionarios={concesionarios} seleccionado={seleccionado} />
        </>
      )}
    </MapContainer>
  )
}

export default MapaConcesionarios
