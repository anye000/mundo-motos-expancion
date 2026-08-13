import { useMemo, useState } from 'react'
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Rocket,
  TrendingUp,
} from 'lucide-react'
import { useExpansiones } from '@hooks/useExpansiones'
import { EstadoExpansion, Expansion } from '../types/expansion'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const ESTADO_LABEL: Record<EstadoExpansion, string> = {
  proximo: 'Próximo',
  en_ejecucion: 'En ejecución',
  completado: 'Completado',
}

const ESTADO_BADGE: Record<EstadoExpansion, string> = {
  proximo: 'bg-mm-info/15 text-mm-info border-mm-info/30',
  en_ejecucion: 'bg-mm-warning/15 text-mm-warning border-mm-warning/30',
  completado: 'bg-mm-success/15 text-mm-success border-mm-success/30',
}

const ESTADO_CHIP: Record<EstadoExpansion, string> = {
  proximo: 'border-mm-info/40 text-mm-info',
  en_ejecucion: 'border-mm-warning/40 text-mm-warning',
  completado: 'border-mm-success/40 text-mm-success',
}

const ESTADO_DOT: Record<EstadoExpansion, string> = {
  proximo: 'bg-mm-info',
  en_ejecucion: 'bg-mm-warning',
  completado: 'bg-mm-success',
}

const ESTADO_BARRA: Record<EstadoExpansion, string> = {
  proximo: 'bg-mm-info',
  en_ejecucion: 'bg-mm-warning',
  completado: 'bg-mm-success',
}

/** Texto de cuenta regresiva derivado de la fecha de apertura vs. hoy. */
function cuentaRegresiva(fechaApertura: string): { texto: string; clase: string } {
  const dias = differenceInCalendarDays(parseISO(fechaApertura), startOfDay(new Date()))
  if (dias === 0) return { texto: 'Hoy', clase: 'text-mm-yellow font-bold' }
  if (dias === 1) return { texto: 'Mañana', clase: 'text-mm-warning font-semibold' }
  if (dias > 1) return { texto: `en ${dias} días`, clase: 'text-mm-warning font-semibold' }
  const pasados = Math.abs(dias)
  if (pasados === 1) return { texto: 'hace 1 día', clase: 'text-mm-gray-400' }
  return { texto: `hace ${pasados} días`, clase: 'text-mm-gray-400' }
}

function BadgeEstado({ estado }: { estado: EstadoExpansion }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_BADGE[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  )
}

export function CronogramaExpansions() {
  const { expansiones, cargando, error, recargar } = useExpansiones()
  const [mesVisible, setMesVisible] = useState(() => new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const porFecha = useMemo(() => {
    const mapa = new Map<string, Expansion[]>()
    for (const expansion of expansiones) {
      const actuales = mapa.get(expansion.fecha_apertura) ?? []
      actuales.push(expansion)
      mapa.set(expansion.fecha_apertura, actuales)
    }
    return mapa
  }, [expansiones])

  const totales = useMemo(
    () => ({
      proximo: expansiones.filter((e) => e.estado === 'proximo').length,
      en_ejecucion: expansiones.filter((e) => e.estado === 'en_ejecucion').length,
      completado: expansiones.filter((e) => e.estado === 'completado').length,
    }),
    [expansiones]
  )

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesVisible), { weekStartsOn: 1 })
    const fin = endOfWeek(endOfMonth(mesVisible), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: inicio, end: fin })
  }, [mesVisible])

  const expansionesDelMes = useMemo(
    () =>
      expansiones
        .filter((e) => isSameMonth(parseISO(e.fecha_apertura), mesVisible))
        .sort((a, b) => a.fecha_apertura.localeCompare(b.fecha_apertura)),
    [expansiones, mesVisible]
  )

  const listadoVisible =
    diaSeleccionado !== null
      ? expansionesDelMes.filter((e) => e.fecha_apertura === diaSeleccionado)
      : expansionesDelMes

  const tituloMes = format(mesVisible, "MMMM 'de' yyyy", { locale: es })
  const tituloCapitalizado = tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1)

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera + navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <CalendarDays className="h-5 w-5 text-mm-yellow" />
          Cronograma de Expansión
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMesVisible((m) => addMonths(m, -1))
              setDiaSeleccionado(null)
            }}
            className="rounded-lg border border-mm-gray-600 p-1.5 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm font-semibold text-mm-gray-100">
            {tituloCapitalizado}
          </span>
          <button
            type="button"
            onClick={() => {
              setMesVisible((m) => addMonths(m, 1))
              setDiaSeleccionado(null)
            }}
            className="rounded-lg border border-mm-gray-600 p-1.5 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMesVisible(new Date())
              setDiaSeleccionado(null)
            }}
            className="rounded-lg bg-mm-yellow px-3 py-1.5 text-xs font-bold text-mm-black hover:bg-mm-yellow-dark transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-mm-error/10 border border-mm-error/40 px-4 py-3">
          <p className="text-sm text-mm-error">{error}</p>
          <button
            type="button"
            onClick={recargar}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error hover:bg-mm-error/10 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-mm-gray-900 p-2.5">
            <Rocket className="h-5 w-5 text-mm-info" />
          </div>
          <div>
            <p className="text-xs font-medium text-mm-gray-400">Próximas</p>
            <p className="text-2xl font-bold text-white">{totales.proximo}</p>
          </div>
        </div>
        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-mm-gray-900 p-2.5">
            <TrendingUp className="h-5 w-5 text-mm-warning" />
          </div>
          <div>
            <p className="text-xs font-medium text-mm-gray-400">En ejecución</p>
            <p className="text-2xl font-bold text-white">{totales.en_ejecucion}</p>
          </div>
        </div>
        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-mm-gray-900 p-2.5">
            <CheckCircle2 className="h-5 w-5 text-mm-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-mm-gray-400">Completadas</p>
            <p className="text-2xl font-bold text-white">{totales.completado}</p>
          </div>
        </div>
      </div>

      {/* Calendario mensual */}
      <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4">
        <div className="mb-3 grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="text-center text-xs font-semibold uppercase tracking-wide text-mm-gray-400"
            >
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia) => {
            const formato = format(dia, 'yyyy-MM-dd')
            const fueraDeMes = !isSameMonth(dia, mesVisible)
            const esHoy = isSameDay(dia, new Date())
            const aperturas = porFecha.get(formato) ?? []
            const seleccionado = diaSeleccionado === formato
            return (
              <button
                key={formato}
                type="button"
                disabled={aperturas.length === 0}
                onClick={() =>
                  setDiaSeleccionado((prev) => (prev === formato ? null : formato))
                }
                className={`flex min-h-[92px] flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                  seleccionado
                    ? 'border-mm-yellow bg-mm-gray-700'
                    : fueraDeMes
                      ? 'border-mm-gray-800 bg-mm-gray-900 opacity-40'
                      : aperturas.length > 0
                        ? 'border-mm-gray-600 bg-mm-gray-900 hover:border-mm-yellow/60'
                        : 'border-mm-gray-800 bg-mm-gray-900'
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    esHoy
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-mm-yellow text-mm-black'
                      : fueraDeMes
                        ? 'text-mm-gray-600'
                        : 'text-mm-gray-300'
                  }`}
                >
                  {format(dia, 'd')}
                </span>
                <div className="flex w-full flex-col gap-1">
                  {aperturas.slice(0, 2).map((expansion) => (
                    <span
                      key={expansion.id}
                      className={`flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight ${ESTADO_CHIP[expansion.estado]}`}
                      title={expansion.concesionario}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ESTADO_DOT[expansion.estado]}`} />
                      <span className="truncate">{expansion.locacion.split(',')[0]}</span>
                    </span>
                  ))}
                  {aperturas.length > 2 && (
                    <span className="text-[10px] font-medium text-mm-gray-400">
                      +{aperturas.length - 2} más
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Listado detallado del mes */}
      <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <CalendarDays className="h-4 w-4 text-mm-yellow" />
            {diaSeleccionado !== null
              ? `Aperturas del ${format(parseISO(diaSeleccionado), 'd MMMM yyyy', { locale: es })}`
              : `Aperturas de ${tituloCapitalizado}`}
          </h3>
          {diaSeleccionado !== null && (
            <button
              type="button"
              onClick={() => setDiaSeleccionado(null)}
              className="text-xs font-medium text-mm-gray-400 hover:text-mm-yellow transition-colors"
            >
              Ver todo el mes
            </button>
          )}
        </div>

        {cargando && expansiones.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-mm-gray-300">
            <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
            Cargando expansiones...
          </div>
        ) : listadoVisible.length === 0 ? (
          <p className="py-8 text-center text-sm text-mm-gray-400">
            {diaSeleccionado !== null
              ? 'No hay aperturas programadas para este día.'
              : 'Sin aperturas programadas para este mes.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {listadoVisible.map((expansion) => {
              const { texto, clase } = cuentaRegresiva(expansion.fecha_apertura)
              return (
                <li
                  key={expansion.id}
                  className="rounded-lg border border-mm-gray-700 bg-mm-gray-900 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {expansion.concesionario}
                      </p>
                      <p className="mt-0.5 text-xs text-mm-gray-400">
                        {expansion.locacion} ·{' '}
                        {format(parseISO(expansion.fecha_apertura), 'EEEE d MMMM yyyy', {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeEstado estado={expansion.estado} />
                      <span className={`text-xs ${clase}`}>{texto}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-mm-gray-700">
                      <div
                        className={`h-full rounded-full ${ESTADO_BARRA[expansion.estado]}`}
                        style={{ width: `${expansion.avance}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-mm-gray-300">
                      {expansion.avance}%
                    </span>
                  </div>
                  {expansion.observaciones && (
                    <p className="mt-2 text-xs text-mm-gray-400">{expansion.observaciones}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default CronogramaExpansions
