import { FormEvent, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { MapPin, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiService } from '@services/api'
import { iconoConcesionario } from '@components/MapaConcesionarios'
import { Concesionario, EstadoOperativo } from '../types/concesionario'

const CENTRO_COLOMBIA: [number, number] = [4.60971, -74.08175]

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

export interface ConcesionarioModalProps {
  abierto: boolean
  onCerrar: () => void
  onCreado: (concesionario: Concesionario) => void
}

export function ConcesionarioModal({ abierto, onCerrar, onCreado }: ConcesionarioModalProps) {
  const [form, setForm] = useState<FormConcesionario>(FORM_INICIAL)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (abierto) {
      setForm(FORM_INICIAL)
      setError(null)
    }
  }, [abierto])

  const ubicacion = useMemo(() => {
    const lat = Number(form.latitud)
    const lng = Number(form.longitud)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return { lat, lng }
  }, [form.latitud, form.longitud])

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

    setEnviando(true)
    setError(null)
    try {
      const creado = await apiService.createConcesionario({
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
      })
      toast.success('Concesionario creado exitosamente')
      onCreado(creado)
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'Error al crear el concesionario'
      setError(mensaje)
      toast.error(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-mm-gray-800 border border-mm-gray-600 shadow-xl animate-fadeInDown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-mm-yellow px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-mm-yellow" />
            <h2 className="text-lg font-bold text-mm-yellow">Nuevo concesionario</h2>
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
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
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
            <div className="mt-3 h-64 w-full overflow-hidden rounded-lg border border-mm-gray-600">
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
                <ClicUbicacion onClic={fijarUbicacion} />
                {ubicacion && (
                  <Marker
                    position={[ubicacion.lat, ubicacion.lng]}
                    icon={iconoConcesionario('activo')}
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
              {enviando ? 'Guardando...' : 'Guardar concesionario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConcesionarioModal
