import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Flag,
  Loader2,
  MapPin,
  Rocket,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useConcesionarios } from '@hooks/useConcesionarios'
import { useExpansiones } from '@hooks/useExpansiones'
import { Expansion } from '../types/expansion'

/** Texto de cuenta regresiva derivado de la fecha de apertura vs. hoy. */
function cuentaRegresiva(fechaApertura: string): string {
  const dias = differenceInCalendarDays(parseISO(fechaApertura), startOfDay(new Date()))
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias > 1) return `en ${dias} días`
  const pasados = Math.abs(dias)
  return pasados === 1 ? 'hace 1 día' : `hace ${pasados} días`
}

interface KpiCardProps {
  etiqueta: string
  valor: ReactNode
  detalle?: string
  icono: LucideIcon
  destacada?: boolean
}

function KpiCard({ etiqueta, valor, detalle, icono: Icono, destacada = false }: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border bg-black p-5 transition-colors ${
        destacada ? 'border-mm-yellow/70' : 'border-mm-gray-700 hover:border-mm-yellow/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">{etiqueta}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            destacada ? 'bg-mm-yellow text-mm-black' : 'bg-mm-gray-800 text-mm-yellow'
          }`}
        >
          <Icono className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-mm-gray-400">{detalle}</p>}
    </div>
  )
}

/**
 * Dashboard Gerencial: vista ejecutiva con KPIs de la red de concesionarios y
 * del plan de expansión 2026, más accesos directos a cada sección. Consume los
 * hooks existentes y navega con el router (react-router-dom).
 */
export function DashboardGerencial() {
  const {
    concesionarios,
    total,
    cargando: concesionariosCargando,
    error: concesionariosError,
    recargar: recargarConcesionarios,
  } = useConcesionarios()
  const {
    expansiones,
    cargando: expansionesCargando,
    error: expansionesError,
    recargar: recargarExpansiones,
  } = useExpansiones()

  const kpis = useMemo(() => {
    const hoy = startOfDay(new Date())
    const en2026 = (e: Expansion) => parseISO(e.fecha_apertura).getFullYear() === 2026

    const activos = concesionarios.filter((c) => c.estado === 'activo').length
    const inactivos = concesionarios.filter((c) => c.estado === 'inactivo').length
    const proximas = expansiones.filter((e) => e.estado === 'proximo' && en2026(e)).length
    const enEjecucion = expansiones.filter((e) => e.estado === 'en_ejecucion' && en2026(e)).length
    const completadas = expansiones.filter((e) => e.estado === 'completado' && en2026(e)).length

    const pendientes = expansiones
      .filter(
        (e) =>
          (e.estado === 'proximo' || e.estado === 'en_ejecucion') &&
          parseISO(e.fecha_apertura) >= hoy
      )
      .sort((a, b) => a.fecha_apertura.localeCompare(b.fecha_apertura))

    return {
      activos,
      inactivos,
      proximas,
      enEjecucion,
      completadas,
      departamentos: new Set(concesionarios.map((c) => c.departamento)).size,
      porcentajeActivos: total > 0 ? Math.round((activos / total) * 100) : 0,
      proximaApertura: pendientes[0] ?? null,
      proximasAperturas: pendientes.slice(0, 3),
    }
  }, [concesionarios, expansiones, total])

  const cargando = concesionariosCargando || expansionesCargando
  const error = concesionariosError || expansionesError

  if (cargando && concesionarios.length === 0 && expansiones.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-mm-gray-700 bg-mm-gray-800 px-4 py-12 text-sm text-mm-gray-300">
        <Loader2 className="h-5 w-5 animate-spin text-mm-yellow" />
        Cargando panel gerencial...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera */}
      <section className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mm-yellow">
          Mundo Motos · Panel Gerencial
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Panel de Control <span className="text-mm-yellow">2026</span>
        </h2>
        <p className="text-sm text-mm-gray-400">
          Estado de la red de concesionarios y del plan de expansión en un vistazo.
        </p>
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-mm-error/40 bg-mm-error/10 px-4 py-3">
          <p className="text-sm text-mm-error">{error}</p>
          <button
            type="button"
            onClick={() => {
              recargarConcesionarios()
              recargarExpansiones()
            }}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error transition-colors hover:bg-mm-error/10"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPIs ejecutivos */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          etiqueta="Total concesionarios"
          valor={total}
          detalle={`${kpis.departamentos} departamentos cubiertos`}
          icono={Building2}
        />
        <KpiCard
          etiqueta="Activos"
          valor={kpis.activos}
          detalle={`${kpis.porcentajeActivos}% de la red`}
          icono={CheckCircle2}
        />
        <KpiCard etiqueta="Inactivos" valor={kpis.inactivos} icono={XCircle} />
        <KpiCard etiqueta="Próximas aperturas 2026" valor={kpis.proximas} icono={Rocket} />

        <KpiCard etiqueta="En ejecución 2026" valor={kpis.enEjecucion} icono={TrendingUp} />
        <KpiCard etiqueta="Completadas 2026" valor={kpis.completadas} icono={Flag} />

        {/* Próxima apertura (tarjeta destacada a lo ancho) */}
        <div className="flex flex-col gap-4 rounded-xl border border-mm-yellow/70 bg-black p-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
              <CalendarClock className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
                Próxima apertura
              </p>
              {kpis.proximaApertura ? (
                <>
                  <p className="truncate text-xl font-bold text-white">
                    {kpis.proximaApertura.concesionario}
                  </p>
                  <p className="text-sm text-mm-gray-400">
                    {format(parseISO(kpis.proximaApertura.fecha_apertura), 'EEEE d MMMM yyyy', {
                      locale: es,
                    })}{' '}
                    · <span className="font-semibold text-mm-yellow">{cuentaRegresiva(kpis.proximaApertura.fecha_apertura)}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-mm-gray-400">Sin aperturas programadas.</p>
              )}
            </div>
          </div>
          {kpis.proximaApertura && kpis.proximaApertura.estado === 'en_ejecucion' && (
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-mm-gray-800 sm:w-40">
                <div
                  className="h-full rounded-full bg-mm-yellow"
                  style={{ width: `${kpis.proximaApertura.avance}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-mm-gray-300">
                {kpis.proximaApertura.avance}%
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Accesos directos */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Link
          to="/expansiones"
          className="group flex flex-col gap-4 rounded-xl border border-mm-gray-700 bg-black p-6 transition-colors hover:border-mm-yellow/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mm-gray-800 text-mm-yellow">
                <Rocket className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white">Cronograma de Expansiones</p>
                <p className="text-xs text-mm-gray-400">Plan de aperturas 2026</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-mm-yellow transition-transform group-hover:translate-x-1" />
          </div>

          <div className="rounded-lg border border-mm-gray-800 bg-mm-gray-800/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
              Próximas aperturas
            </p>
            {kpis.proximasAperturas.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {kpis.proximasAperturas.map((expansion) => (
                  <li key={expansion.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-mm-gray-200">
                      {expansion.locacion.split(',')[0]}
                    </span>
                    <span className="shrink-0 text-xs text-mm-gray-400">
                      {format(parseISO(expansion.fecha_apertura), 'd MMM', { locale: es })} ·{' '}
                      <span className="text-mm-yellow">{cuentaRegresiva(expansion.fecha_apertura)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mm-gray-400">Sin aperturas programadas.</p>
            )}
          </div>

          <span className="mt-auto text-xs font-bold uppercase tracking-wider text-mm-yellow">
            Abrir cronograma
          </span>
        </Link>

        <Link
          to="/concesionarios"
          className="group flex flex-col gap-4 rounded-xl border border-mm-gray-700 bg-black p-6 transition-colors hover:border-mm-yellow/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mm-gray-800 text-mm-yellow">
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white">Gestión de Concesionarios</p>
                <p className="text-xs text-mm-gray-400">Mapa, filtros y mantenimiento</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-mm-yellow transition-transform group-hover:translate-x-1" />
          </div>

          <div className="rounded-lg border border-mm-gray-800 bg-mm-gray-800/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
              Estado de la red
            </p>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-mm-gray-200">
                {kpis.activos} de {total} activos
              </span>
              <span className="font-semibold text-mm-yellow">{kpis.porcentajeActivos}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-mm-gray-800">
              <div
                className="h-full rounded-full bg-mm-yellow"
                style={{ width: `${kpis.porcentajeActivos}%` }}
              />
            </div>
          </div>

          <span className="mt-auto text-xs font-bold uppercase tracking-wider text-mm-yellow">
            Gestionar concesionarios
          </span>
        </Link>
      </section>
    </div>
  )
}

export default DashboardGerencial
