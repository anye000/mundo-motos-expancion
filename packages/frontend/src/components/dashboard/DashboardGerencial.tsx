import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
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
  Target,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useConcesionarios } from '@hooks/useConcesionarios'
import { useExpansiones } from '@hooks/useExpansiones'
import { BigNumberCard } from './BigNumberCard'
import { GraficoBarras } from './GraficoBarras'
import { GraficoPie } from './GraficoPie'
import { SelectorFechas } from './SelectorFechas'
import { cuentaRegresiva } from './formateo'
import { useFiltrosDashboard } from './useFiltrosDashboard'

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

export function DashboardGerencial() {
  const {
    concesionarios,
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

  const {
    filtros,
    concesionariosFiltrados,
    kpis,
    datosPie,
    datosBarras,
    totalBarras,
    hayFiltros,
    cambiarRango,
    seleccionarEstado,
    seleccionarMes,
    limpiarFiltros,
  } = useFiltrosDashboard(concesionarios, expansiones)

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
      <section className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mm-yellow">
          Mundo Motos · Panel Gerencial
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Panel de Control <span className="text-mm-yellow">2026</span>
        </h2>
        <p className="text-sm text-mm-gray-400">
          Estado de la red de concesionarios y del plan de expansión. Haz clic en los gráficos para
          filtrar todo el panel.
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

      <SelectorFechas
        desde={filtros.desde}
        hasta={filtros.hasta}
        hayFiltros={hayFiltros}
        onCambiarRango={cambiarRango}
        onLimpiar={limpiarFiltros}
      />

      {/* Big Number Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BigNumberCard
          etiqueta="Total red"
          valor={concesionariosFiltrados.length}
          detalle={`${kpis.departamentos} departamentos cubiertos`}
          icono={Building2}
        />
        <BigNumberCard
          etiqueta="Progreso de la meta"
          valor={`${kpis.progresoMeta.toFixed(1)}%`}
          detalle={`${kpis.completadas2026} de ${kpis.meta2026} aperturas completadas`}
          icono={Target}
          destacado
        />
        <BigNumberCard
          etiqueta="Próximas aperturas"
          valor={kpis.proximasAperturas.length}
          detalle={
            kpis.proximaApertura
              ? `Siguiente: ${kpis.proximaApertura.locacion.split(',')[0]}`
              : 'Sin aperturas pendientes'
          }
          icono={Rocket}
        />
      </section>

      {/* KPIs ejecutivos */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          etiqueta="Total concesionarios"
          valor={kpis.total}
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
      </section>

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
                  ·{' '}
                  <span className="font-semibold text-mm-yellow">
                    {cuentaRegresiva(kpis.proximaApertura.fecha_apertura)}
                  </span>
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

      <section className="rounded-xl border border-mm-yellow/70 bg-black p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
              <Target className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
                Meta de expansión 2026
              </p>
              <p className="text-2xl font-bold text-white">
                {kpis.completadas2026} <span className="text-mm-gray-400">de</span>{' '}
                {kpis.meta2026}{' '}
                <span className="text-base font-medium text-mm-gray-400">aperturas completadas</span>
              </p>
            </div>
          </div>
          <p className="text-4xl font-bold text-mm-yellow">{kpis.progresoMeta.toFixed(1)}%</p>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-mm-gray-800">
          <div
            className="h-full rounded-full bg-mm-yellow transition-all duration-500"
            style={{ width: `${Math.min(100, kpis.progresoMeta)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-mm-gray-400">
          Progreso calculado de forma dinámica en función de las aperturas programadas y completadas
          para el año 2026.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-mm-yellow/60 bg-black p-5 shadow-[0_0_28px_rgba(255,204,0,0.14)]">
          <h3 className="mb-1 text-sm font-bold text-white">Estado operativo de la red</h3>
          <p className="mb-4 text-xs text-mm-gray-400">
            Distribución de concesionarios por estado operativo. Haz clic para filtrar.
          </p>
          <GraficoPie datos={datosPie} activo={filtros.estado} onSeleccionar={seleccionarEstado} />
        </div>
        <div className="rounded-2xl border border-mm-yellow/60 bg-black p-5 shadow-[0_0_28px_rgba(255,204,0,0.14)]">
          <h3 className="mb-1 text-sm font-bold text-white">Aperturas por periodo</h3>
          <p className="mb-4 text-xs text-mm-gray-400">
            Distribución de las aperturas en el rango seleccionado. Haz clic para filtrar.
          </p>
          <GraficoBarras
            datos={datosBarras}
            activo={filtros.mes}
            total={totalBarras}
            onSeleccionar={seleccionarMes}
          />
        </div>
      </section>

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
                      <span className="text-mm-yellow">
                        {cuentaRegresiva(expansion.fecha_apertura)}
                      </span>
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
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mm-gray-800 text-mm-yellow">
              <MapPin className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-white">Gestión de Concesionarios</p>
              <p className="text-xs text-mm-gray-400">Mapa, filtros y mantenimiento</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-mm-yellow transition-transform group-hover:translate-x-1" />
          </div>

          <div className="rounded-lg border border-mm-gray-800 bg-mm-gray-800/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mm-gray-400">
              Estado de la red
            </p>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-mm-gray-200">
                {kpis.activos} de {concesionariosFiltrados.length} activos
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