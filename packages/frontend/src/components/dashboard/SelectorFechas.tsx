import { memo } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarRange, FilterX } from 'lucide-react'

interface SelectorFechasProps {
  desde: Date | null
  hasta: Date | null
  hayFiltros: boolean
  onCambiarRango: (desde: Date | null, hasta: Date | null) => void
  onLimpiar: () => void
}

function aISO(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd')
}

function aFecha(iso: string): Date | null {
  const f = parseISO(iso)
  return Number.isNaN(f.getTime()) ? null : f
}

export const SelectorFechas = memo(function SelectorFechas({
  desde,
  hasta,
  hayFiltros,
  onCambiarRango,
  onLimpiar,
}: SelectorFechasProps) {
  return (
    <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-mm-yellow/60 bg-black p-4 shadow-[0_0_28px_rgba(255,204,0,0.14)]">
      <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-mm-yellow text-mm-black">
        <CalendarRange className="h-4 w-4" />
      </span>
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-desde" className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
          Desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={desde ? aISO(desde) : ''}
          onChange={(e) => onCambiarRango(e.target.value ? aFecha(e.target.value) : null, hasta)}
          className="rounded-lg border border-mm-gray-700 bg-mm-gray-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-mm-yellow/70 [color-scheme:dark]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-hasta" className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
          Hasta
        </label>
        <input
          id="filtro-hasta"
          type="date"
          value={hasta ? aISO(hasta) : ''}
          onChange={(e) => onCambiarRango(desde, e.target.value ? aFecha(e.target.value) : null)}
          className="rounded-lg border border-mm-gray-700 bg-mm-gray-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-mm-yellow/70 [color-scheme:dark]"
        />
      </div>
      {hayFiltros && (
        <button
          type="button"
          onClick={onLimpiar}
          className="flex items-center gap-2 rounded-lg border border-mm-yellow/60 px-3 py-2 text-xs font-bold uppercase tracking-wider text-mm-yellow transition-colors hover:bg-mm-yellow/10"
        >
          <FilterX className="h-4 w-4" />
          Limpiar filtros
        </button>
      )}
    </section>
  )
})
