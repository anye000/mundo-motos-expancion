import { Building2, Mail, MapPin, Phone, X } from 'lucide-react'
import { Concesionario } from '../types/concesionario'
import { HistorialInteracciones } from '@components/HistorialInteracciones'

export interface DetalleConcesionarioModalProps {
  concesionario: Concesionario | null
  onCerrar: () => void
}

/**
 * Modal de detalle de un concesionario: datos de contacto y dirección,
 * seguido del historial de interacciones CRM con su formulario rápido.
 */
export function DetalleConcesionarioModal({
  concesionario,
  onCerrar,
}: DetalleConcesionarioModalProps) {
  if (!concesionario) return null

  const activo = concesionario.estado === 'activo'

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
            <Building2 className="h-5 w-5 text-mm-yellow" />
            <h2 className="text-lg font-bold text-mm-yellow">{concesionario.nombre}</h2>
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

        <div className="flex flex-col gap-6 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-mm-gray-400">Estado operativo</p>
              <span
                className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  activo
                    ? 'bg-mm-success/15 text-mm-success border-mm-success/30'
                    : 'bg-mm-error/15 text-mm-error border-mm-error/30'
                }`}
              >
                {activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-mm-gray-400">NIT</p>
              <p className="mt-1 text-sm text-mm-gray-200">{concesionario.nit}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-mm-gray-400">Dirección</p>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-mm-gray-200">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mm-yellow" />
                {concesionario.direccion}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-mm-gray-400">Ciudad</p>
              <p className="mt-1 text-sm text-mm-gray-200">
                {concesionario.ciudad} · {concesionario.departamento}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-mm-gray-400">Teléfono</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-mm-gray-200">
                <Phone className="h-3.5 w-3.5 text-mm-yellow" />
                {concesionario.telefono || 'No registrado'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-mm-gray-400">Email</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-mm-gray-200">
                <Mail className="h-3.5 w-3.5 text-mm-yellow" />
                {concesionario.email}
              </p>
            </div>
          </div>

          <div className="border-t border-mm-gray-700 pt-5">
            <HistorialInteracciones concesionarioId={concesionario.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetalleConcesionarioModal
