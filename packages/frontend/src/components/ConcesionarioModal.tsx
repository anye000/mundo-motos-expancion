import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { Loader2, MapPin, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiService } from '@services/api'
import { BuscadorDireccion } from '@components/BuscadorDireccion'
import { geocodificarInversa, ResultadoGeocodificacion } from '@utils/geocodificacion'
import { iconoConcesionario } from '@components/MapaConcesionarios'
import { Concesionario, EstadoOperativo, TipoExpansion } from '../types/concesionario'
import { ESTADO_LABEL, ORDEN_ESTADOS } from '@utils/estadosConcesionario'

const CENTRO_VENEZUELA: [number, number] = [6.5, -66.5]

interface FormConcesionario {
  nombre: string
  razon_social: string
  nit: string
  email: string
  telefono: string
  ciudad: string
  departamento: string
  direccion: string
  latitud: string
  longitud: string
  estado: EstadoOperativo
  fecha_apertura_programada: string
  tipo_expansion: string
}

const FORM_INICIAL: FormConcesionario = {
  nombre: '',
  razon_social: '',
  nit: '',
  email: '',
  telefono: '',
  ciudad: '',
  departamento: '',
  direccion: '',
  latitud: '',
  longitud: '',
  estado: 'activo',
  fecha_apertura_programada: '',
  tipo_expansion: 'apertura',
}

/** Captura clics en el mini-mapa para fijar las coordenadas. */
function ClicUbicacion({ onClic }: { onClic: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClic(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Vuela al marcador cuando cambia su posición, salvo mientras se arrastra. */
function VolarAUbicacion({
  lat,
  lng,
  arrastrandoRef,
}: {
  lat: number
  lng: number
  arrastrandoRef: React.MutableRefObject<boolean>
}) {
  const map = useMap()

  useEffect(() => {
    if (!arrastrandoRef.current) {
      map.flyTo([lat, lng], 14, { duration: 0.6 })
    }
  }, [lat, lng, map, arrastrandoRef])

  return null
}

export interface ConcesionarioModalProps {
  abierto: boolean
  concesionario?: Concesionario | null
  onCerrar: () => void
  onGuardado: (concesionario: Concesionario) => void
}

function esEstadoExpansion(estado: EstadoOperativo): boolean {
  return ['proximo', 'en_ejecucion', 'completado'].includes(estado)
}

function aFormulario(concesionario: Concesionario): FormConcesionario {
  return {
    nombre: concesionario.nombre,
    razon_social: concesionario.razon_social,
    nit: concesionario.nit,
    email: concesionario.email,
    telefono: concesionario.telefono ?? '',
    ciudad: concesionario.ciudad,
    departamento: concesionario.departamento,
    direccion: concesionario.direccion,
    latitud: String(concesionario.latitud),
    longitud: String(concesionario.longitud),
    estado: concesionario.estado,
    fecha_apertura_programada: concesionario.fecha_apertura_programada ?? '',
    tipo_expansion: concesionario.tipo_expansion,
  }
}

export function ConcesionarioModal({
  abierto,
  concesionario = null,
  onCerrar,
  onGuardado,
}: ConcesionarioModalProps) {
  const [form, setForm] = useState<FormConcesionario>(FORM_INICIAL)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [geocodificando, setGeocodificando] = useState(false)
  const arrastrandoRef = useRef(false)
  const marcadorRef = useRef<L.Marker | null>(null)
  const inversoRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (abierto) {
      setForm(concesionario ? aFormulario(concesionario) : FORM_INICIAL)
      setError(null)
      setGeocodificando(false)
    }
  }, [abierto, concesionario])

  const ubicacion = useMemo(() => {
    const lat = Number(form.latitud)
    const lng = Number(form.longitud)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return { lat, lng }
  }, [form.latitud, form.longitud])

  useEffect(() => {
    if (ubicacion && marcadorRef.current) {
      marcadorRef.current.openPopup()
    }
  }, [ubicacion])

  useEffect(() => {
    return () => inversoRef.current?.abort()
  }, [])

  if (!abierto) return null

  function actualizar(campo: keyof FormConcesionario, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function fijarUbicacion(lat: number, lng: number) {
    setForm((prev) => ({
      ...prev,
      latitud: lat.toFixed(6),
      longitud: lng.toFixed(6),
    }))

    inversoRef.current?.abort()
    const controlador = new AbortController()
    inversoRef.current = controlador
    setGeocodificando(true)
    geocodificarInversa(lat, lng, controlador.signal)
      .then((resultado) => {
        if (controlador.signal.aborted) return
        setForm((prev) => ({
          ...prev,
          ciudad: prev.ciudad || resultado.ciudad,
          departamento: prev.departamento || resultado.departamento,
          direccion: prev.direccion || resultado.direccion,
        }))
      })
      .catch(() => {
        // Silencioso: el usuario puede ingresar los datos manualmente.
      })
      .finally(() => {
        if (!controlador.signal.aborted) setGeocodificando(false)
      })
  }

  function manejarResultadoBuscador(resultado: ResultadoGeocodificacion) {
    setForm((prev) => ({
      ...prev,
      latitud: resultado.lat.toFixed(6),
      longitud: resultado.lng.toFixed(6),
      ciudad: prev.ciudad || resultado.ciudad,
      departamento: prev.departamento || resultado.departamento,
      direccion: prev.direccion || resultado.direccion,
    }))
  }

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const { nombre, razon_social, nit, email, ciudad, departamento, direccion } = form
    if (!nombre.trim() || !razon_social.trim() || !nit.trim() || !email.trim()) {
      setError('Los campos nombre, razón social, NIT y email son obligatorios')
      return
    }
    if (!ciudad.trim() || !departamento.trim() || !direccion.trim()) {
      setError('Los campos ciudad, departamento y dirección son obligatorios')
      return
    }
    const lat = Number(form.latitud)
    const lng = Number(form.longitud)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Ingresa coordenadas válidas (usa el mapa o los campos lat/lng)')
      return
    }
    const esEstadoExpansion = ['proximo', 'en_ejecucion', 'completado'].includes(form.estado)
    if (esEstadoExpansion && !form.fecha_apertura_programada) {
      setError('La fecha de apertura programada es obligatoria para estados de expansión')
      return
    }

    setEnviando(true)
    setError(null)
    try {
      const payload = {
        nombre: nombre.trim(),
        razon_social: razon_social.trim(),
        nit: nit.trim(),
        email: email.trim(),
        telefono: form.telefono.trim() || null,
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
        direccion: direccion.trim(),
        latitud: lat,
        longitud: lng,
        estado: form.estado,
        fecha_apertura_programada: esEstadoExpansion ? form.fecha_apertura_programada : null,
        tipo_expansion: form.tipo_expansion as TipoExpansion,
      }
      const guardado = concesionario
        ? await apiService.updateConcesionario(concesionario.id, payload)
        : await apiService.createConcesionario(payload)
      toast.success(
        concesionario
          ? 'Concesionario actualizado exitosamente'
          : 'Concesionario creado exitosamente'
      )
      onGuardado(guardado)
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'Error al guardar el concesionario'
      setError(mensaje)
      toast.error(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-black border border-mm-gray-700 shadow-xl animate-fadeInDown"
        style={{ colorScheme: 'dark' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-mm-yellow px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-mm-yellow" />
            <h2 className="text-lg font-bold text-mm-yellow">
              {concesionario ? 'Editar concesionario' : 'Nuevo concesionario'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="flex flex-col gap-4 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Nombre *</span>
              <input
                className="input-dark"
                value={form.nombre}
                onChange={(e) => actualizar('nombre', e.target.value)}
                placeholder="Concesionario Centro"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Razón social *</span>
              <input
                className="input-dark"
                value={form.razon_social}
                onChange={(e) => actualizar('razon_social', e.target.value)}
                placeholder="Mundo Motos S.A.S."
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">NIT *</span>
              <input
                className="input-dark"
                value={form.nit}
                onChange={(e) => actualizar('nit', e.target.value)}
                placeholder="900123456-7"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Email *</span>
              <input
                type="email"
                className="input-dark"
                value={form.email}
                onChange={(e) => actualizar('email', e.target.value)}
                placeholder="contacto@mundo.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Teléfono</span>
              <input
                className="input-dark"
                value={form.telefono}
                onChange={(e) => actualizar('telefono', e.target.value)}
                placeholder="+57 1 234 5678"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Estado operativo</span>
              <select
                className="input-dark"
                value={form.estado}
                onChange={(e) => actualizar('estado', e.target.value)}
              >
                <option value="">Selecciona un estado</option>
                {ORDEN_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {ESTADO_LABEL[estado]}
                  </option>
                ))}
              </select>
            </label>
            {esEstadoExpansion(form.estado) && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-mm-gray-300">
                    Tipo de expansión
                  </span>
                  <select
                    className="input-dark"
                    value={form.tipo_expansion}
                    onChange={(e) => actualizar('tipo_expansion', e.target.value)}
                  >
                    <option value="apertura">Apertura</option>
                    <option value="ampliacion">Ampliación</option>
                    <option value="relocalizacion">Relocalización</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-mm-gray-300">
                    Apertura programada *
                  </span>
                  <input
                    type="date"
                    className="input-dark"
                    value={form.fecha_apertura_programada}
                    onChange={(e) => actualizar('fecha_apertura_programada', e.target.value)}
                  />
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Ciudad *</span>
              <input
                className="input-dark"
                value={form.ciudad}
                onChange={(e) => actualizar('ciudad', e.target.value)}
                placeholder="Bogotá"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Departamento *</span>
              <input
                className="input-dark"
                value={form.departamento}
                onChange={(e) => actualizar('departamento', e.target.value)}
                placeholder="Cundinamarca"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-mm-gray-300">Dirección *</span>
              <input
                className="input-dark"
                value={form.direccion}
                onChange={(e) => actualizar('direccion', e.target.value)}
                placeholder="Av. 68 # 22-10"
              />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-mm-gray-300">
              Ubicación (haz clic en el mapa o ingresa las coordenadas)
            </span>
            {geocodificando && (
              <span className="mb-1 flex items-center gap-1 text-xs text-mm-yellow">
                <Loader2 className="h-3 w-3 animate-spin" />
                Detectando dirección...
              </span>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-xs text-mm-gray-400">Latitud</span>
                <input
                  type="number"
                  step="any"
                  className="input-dark"
                  value={form.latitud}
                  onChange={(e) => actualizar('latitud', e.target.value)}
                  placeholder="4.60971"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-mm-gray-400">Longitud</span>
                <input
                  type="number"
                  step="any"
                  className="input-dark"
                  value={form.longitud}
                  onChange={(e) => actualizar('longitud', e.target.value)}
                  placeholder="-74.08175"
                />
              </label>
            </div>
            <div className="relative z-0 mt-3 h-64 w-full overflow-hidden rounded-lg border border-mm-gray-600">
              <MapContainer
                center={CENTRO_VENEZUELA}
                zoom={5}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClicUbicacion onClic={fijarUbicacion} />
                <BuscadorDireccion onSeleccionar={manejarResultadoBuscador} placeholder="Buscar dirección..." />
                {ubicacion && (
                  <Marker
                    ref={marcadorRef}
                    position={[ubicacion.lat, ubicacion.lng]}
                    icon={iconoConcesionario('activo')}
                    draggable
                    eventHandlers={{
                      dragstart: () => {
                        arrastrandoRef.current = true
                      },
                      dragend: (e) => {
                        arrastrandoRef.current = false
                        const pos = (e.target as L.Marker).getLatLng()
                        fijarUbicacion(pos.lat, pos.lng)
                      },
                    }}
                  >
                    <Popup>Ubicación seleccionada</Popup>
                  </Marker>
                )}
                {ubicacion && (
                  <VolarAUbicacion
                    lat={ubicacion.lat}
                    lng={ubicacion.lng}
                    arrastrandoRef={arrastrandoRef}
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-mm-error/10 border border-mm-error/40 px-3 py-2 text-sm text-mm-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-mm-gray-700 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-mm-yellow px-4 py-2 text-sm font-bold text-mm-black hover:bg-mm-yellow-dark disabled:opacity-50 transition-colors"
            >
              {enviando
                ? 'Guardando...'
                : concesionario
                  ? 'Guardar cambios'
                  : 'Guardar concesionario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConcesionarioModal
