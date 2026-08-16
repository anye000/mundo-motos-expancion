import { useEffect, useState } from 'react'
import { History, Loader2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { apiService } from '@services/api'
import { EstadoOperativo, HistorialEstado } from '../types/concesionario'

const ESTADO_LABEL: Record<EstadoOperativo, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  proximo: 'Próximo',
  en_ejecucion: 'En ejecución',
  completado: 'Completado',
}

export interface HistorialEstadosProps {
  concesionarioId: string
}

/** Línea de tiempo del historial de cambios de estado operativo de un concesionario. */
export function HistorialEstados({ concesionarioId }: HistorialEstadosProps) {
  const [historial, setHistorial] = useState<HistorialEstado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const datos = await apiService.getHistorialEstados(concesionarioId)
      setHistorial(datos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el historial de estados')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concesionarioId])

  return (
    <section className="flex flex-col gap-4">
      <h3 className="flex items-center justify-between text-sm font-bold text-white">
        <span className="flex items-center gap-2">
          <History className="h-4 w-4 text-mm-yellow" />
          Historial de estados
        </span>
        {historial.length > 0 && (
          <button
            type="button"
            onClick={cargar}
            className="flex items-center gap-1 rounded-lg border border-mm-gray-700 px-2 py-1 text-xs font-medium text-mm-gray-300 transition-colors hover:text-mm-yellow"
            aria-label="Recargar historial"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        )}
      </h3>

      {error && (
        <div className="flex items-center justify-between rounded-lg bg-mm-error/10 border border-mm-error/40 px-4 py-3">
          <p className="text-sm text-mm-error">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error hover:bg-mm-error/10 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-mm-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
          Cargando historial...
        </div>
      ) : historial.length === 0 ? (
        <p className="rounded-lg border border-dashed border-mm-gray-700 py-8 text-center text-sm text-mm-gray-400">
          Aún no hay cambios de estado registrados para este concesionario.
        </p>
      ) : (
        <ol className="relative ml-2 max-h-72 space-y-5 overflow-y-auto border-l-2 border-mm-gray-700 pl-5 pr-1">
          {historial.map((registro) => {
            const anterior = registro.estado_anterior
              ? ESTADO_LABEL[registro.estado_anterior]
              : 'Sin estado'
            const nuevo = ESTADO_LABEL[registro.estado_nuevo]
            return (
              <li key={registro.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-mm-yellow bg-mm-black" />
                <div className="rounded-lg border border-mm-gray-700 bg-mm-gray-900 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-mm-gray-200">
                      De <strong className="text-mm-gray-100">{anterior}</strong>
                      <span className="text-mm-yellow">→</span> a{' '}
                      <strong className="text-mm-yellow">{nuevo}</strong>
                    </span>
                  </div>
                  <time className="mt-1.5 block text-xs text-mm-gray-400">
                    {format(new Date(registro.created_at), "d 'de' MMMM yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </time>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default HistorialEstados