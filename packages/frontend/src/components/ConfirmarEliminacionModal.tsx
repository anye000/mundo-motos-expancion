import { Loader2, Trash2, X } from 'lucide-react'
import { Concesionario } from '../types/concesionario'

export interface ConfirmarEliminacionModalProps {
  abierto: boolean
  concesionario: Concesionario | null
  eliminando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

/**
 * Modal de confirmación para eliminar un concesionario. Mantiene la identidad
 * corporativa (fondo oscuro, acento amarillo) con botón destructivo en rojo.
 */
export function ConfirmarEliminacionModal({
  abierto,
  concesionario,
  eliminando,
  onCancelar,
  onConfirmar,
}: ConfirmarEliminacionModalProps) {
  if (!abierto || !concesionario) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-md rounded-xl bg-mm-gray-900 border border-mm-gray-600 shadow-xl animate-fadeInDown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-mm-yellow px-6 py-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-mm-error" />
            <h2 className="text-lg font-bold text-mm-yellow">Eliminar concesionario</h2>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg p-1 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-sm text-mm-gray-200">
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="font-semibold text-white">{concesionario.nombre}</span>?
          </p>
          <p className="rounded-lg bg-mm-error/10 border border-mm-error/40 px-3 py-2 text-xs text-mm-error">
            Esta acción eliminará también el historial de interacciones CRM del concesionario.
            No se puede deshacer.
          </p>

          <div className="flex justify-end gap-3 border-t border-mm-gray-700 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              disabled={eliminando}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={eliminando}
              className="flex items-center gap-1.5 rounded-lg bg-mm-error px-4 py-2 text-sm font-bold text-white hover:bg-mm-error/90 disabled:opacity-50 transition-colors"
            >
              {eliminando && <Loader2 className="h-4 w-4 animate-spin" />}
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmarEliminacionModal
