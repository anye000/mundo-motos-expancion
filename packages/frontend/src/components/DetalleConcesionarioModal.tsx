import { useState } from 'react'
import { Building2, History, Mail, MapPin, MessagesSquare, Phone, X } from 'lucide-react'
import { Concesionario } from '../types/concesionario'
import { HistorialInteracciones } from '@components/HistorialInteracciones'
import { HistorialEstados } from '@components/HistorialEstados'
import { ESTADO_BADGE, ESTADO_LABEL } from '@utils/estadosConcesionario'

export interface DetalleConcesionarioModalProps {
  concesionario: Concesionario | null
  onCerrar: () => void
}

type Pestana = 'informacion' | 'interacciones' | 'historial'

const PESTANAS: { id: Pestana; label: string; icono: typeof History }[] = [
  { id: 'informacion', label: 'Información', icono: Building2 },
  { id: 'interacciones', label: 'Interacciones', icono: MessagesSquare },
  { id: 'historial', label: 'Historial de estados', icono: History },
]

/**
 * Modal de detalle de un concesionario con pestañas: información general,
 * historial de interacciones y línea de tiempo de cambios de estado.
 */
export function DetalleConcesionarioModal({
  concesionario,
  onCerrar,
}: DetalleConcesionarioModalProps) {
  const [pestana, setPestana] = useState<Pestana>('informacion')
  if (!concesionario) return null

  const esEstadoExpansion = ['proximo', 'en_ejecucion', 'completado'].includes(
    concesionario.estado
  )

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
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

        <div className="flex gap-1 border-b border-mm-gray-700 px-6 pt-3">
          {PESTANAS.map(({ id, label, icono: Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                pestana === id
                  ? 'border-mm-yellow text-mm-yellow'
                  : 'border-transparent text-mm-gray-300 hover:text-white'
              }`}
            >
              <Icono className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          {pestana === 'informacion' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Estado operativo</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[concesionario.estado]}`}
                >
                  {ESTADO_LABEL[concesionario.estado]}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-mm-gray-400">RIF</p>
                <p className="mt-1 text-sm text-mm-gray-200">{concesionario.rif}</p>
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
              {esEstadoExpansion && (
                <div>
                  <p className="text-xs font-medium text-mm-gray-400">Tipo de expansión</p>
                  <p className="mt-1 text-sm capitalize text-mm-gray-200">
                    {concesionario.tipo_expansion.replace('_', ' ')}
                  </p>
                </div>
              )}
              {concesionario.fecha_apertura_programada && (
                <div>
                  <p className="text-xs font-medium text-mm-gray-400">Apertura programada</p>
                  <p className="mt-1 text-sm text-mm-gray-200">
                    {concesionario.fecha_apertura_programada}
                  </p>
                </div>
              )}
            </div>
          )}

          {pestana === 'interacciones' && (
            <div className="border-t border-mm-gray-700 pt-5">
              <HistorialInteracciones concesionarioId={concesionario.id} />
            </div>
          )}

          {pestana === 'historial' && (
            <div className="border-t border-mm-gray-700 pt-5">
              <HistorialEstados concesionarioId={concesionario.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetalleConcesionarioModal
