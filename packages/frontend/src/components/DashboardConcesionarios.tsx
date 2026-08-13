import { useMemo, useState } from 'react'
import { Building2, CalendarDays, CheckCircle2, Filter, Loader2, MapPin, Plus, XCircle } from 'lucide-react'
import { useConcesionarios } from '@hooks/useConcesionarios'
import { MapaConcesionarios } from '@components/MapaConcesionarios'
import { ConcesionarioModal } from '@components/ConcesionarioModal'
import { DetalleConcesionarioModal } from '@components/DetalleConcesionarioModal'
import { CronogramaExpansions } from '@components/CronogramaExpansions'
import { Concesionario, EstadoOperativo } from '../types/concesionario'

function BadgeEstado({ estado }: { estado: EstadoOperativo }) {
  return estado === 'activo' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mm-success/15 text-mm-success border border-mm-success/30">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mm-error/15 text-mm-error border border-mm-error/30">
      Inactivo
    </span>
  )
}

type TabDashboard = 'concesionarios' | 'expansion'

const TABS: { id: TabDashboard; etiqueta: string; icono: typeof MapPin }[] = [
  { id: 'concesionarios', etiqueta: 'Concesionarios', icono: MapPin },
  { id: 'expansion', etiqueta: 'Cronograma de Expansión', icono: CalendarDays },
]

export function DashboardConcesionarios() {
  const [tabActivo, setTabActivo] = useState<TabDashboard>('concesionarios')
  const {
    concesionarios,
    total,
    cargando,
    error,
    filtros,
    cambiarFiltro,
    limpiarFiltros,
    ciudades,
    departamentos,
    recargar,
  } = useConcesionarios()
  const [seleccionado, setSeleccionado] = useState<Concesionario | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [detalle, setDetalle] = useState<Concesionario | null>(null)

  function seleccionar(concesionario: Concesionario) {
    setSeleccionado(concesionario)
    setDetalle(concesionario)
  }

  const totales = useMemo(
    () => ({
      total,
      activos: concesionarios.filter((c) => c.estado === 'activo').length,
      inactivos: concesionarios.filter((c) => c.estado === 'inactivo').length,
    }),
    [concesionarios, total]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Pestañas */}
      <div className="flex w-fit gap-1 rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-1">
        {TABS.map((tab) => {
          const activa = tabActivo === tab.id
          const Icono = tab.icono
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabActivo(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activa
                  ? 'bg-mm-yellow text-mm-black'
                  : 'text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white'
              }`}
            >
              <Icono className="h-4 w-4" />
              {tab.etiqueta}
            </button>
          )
        })}
      </div>

      {tabActivo === 'expansion' ? (
        <CronogramaExpansions />
      ) : (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-mm-gray-900 p-2.5">
            <Building2 className="h-5 w-5 text-mm-yellow" />
          </div>
          <div>
            <p className="text-xs font-medium text-mm-gray-400">Total concesionarios</p>
            <p className="text-2xl font-bold text-white">{totales.total}</p>
          </div>
        </div>
        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-mm-gray-900 p-2.5">
            <CheckCircle2 className="h-5 w-5 text-mm-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-mm-gray-400">Activos</p>
            <p className="text-2xl font-bold text-white">{totales.activos}</p>
          </div>
        </div>
        <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-mm-gray-900 p-2.5">
            <XCircle className="h-5 w-5 text-mm-error" />
          </div>
          <div>
            <p className="text-xs font-medium text-mm-gray-400">Inactivos</p>
            <p className="text-2xl font-bold text-white">{totales.inactivos}</p>
          </div>
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

      {/* Mapa + panel lateral */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative lg:flex-1 min-h-[420px] lg:min-h-[560px] overflow-hidden rounded-xl border border-mm-gray-700 bg-mm-gray-800">
          <MapaConcesionarios
            concesionarios={concesionarios}
            seleccionado={seleccionado}
            onSeleccionar={seleccionar}
          />
          {cargando && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="flex items-center gap-2 rounded-lg bg-mm-gray-800 px-4 py-2 text-sm text-mm-gray-200">
                <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
                Cargando concesionarios...
              </div>
            </div>
          )}
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-[380px]">
          {/* Filtros */}
          <div className="rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Filter className="h-4 w-4 text-mm-yellow" />
                Filtros
              </h3>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs font-medium text-mm-gray-400 hover:text-mm-yellow transition-colors"
              >
                Limpiar
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-mm-gray-400">Departamento</span>
                <select
                  className="input-dark"
                  value={filtros.departamento}
                  onChange={(e) => cambiarFiltro('departamento', e.target.value)}
                >
                  <option value="">Todos los departamentos</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento} value={departamento}>
                      {departamento}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-mm-gray-400">Ciudad</span>
                <select
                  className="input-dark"
                  value={filtros.ciudad}
                  onChange={(e) => cambiarFiltro('ciudad', e.target.value)}
                >
                  <option value="">Todas las ciudades</option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad} value={ciudad}>
                      {ciudad}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-mm-gray-400">Estado operativo</span>
                <select
                  className="input-dark"
                  value={filtros.estado}
                  onChange={(e) => cambiarFiltro('estado', e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>
            </div>
          </div>

          {/* Listado */}
          <div className="flex flex-1 flex-col rounded-xl bg-mm-gray-800 border border-mm-gray-700 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <MapPin className="h-4 w-4 text-mm-yellow" />
                Concesionarios
                <span className="rounded-full bg-mm-gray-700 px-2 py-0.5 text-xs text-mm-gray-300">
                  {concesionarios.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="flex items-center gap-1 rounded-lg bg-mm-yellow px-3 py-1.5 text-xs font-bold text-mm-black hover:bg-mm-yellow-dark transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo
              </button>
            </div>

            {concesionarios.length === 0 && !cargando ? (
              <p className="py-8 text-center text-sm text-mm-gray-400">
                No hay concesionarios que coincidan con los filtros.
              </p>
            ) : (
              <ul className="max-h-[320px] flex-1 space-y-2 overflow-y-auto pr-1">
                {concesionarios.map((concesionario) => {
                  const activo = seleccionado?.id === concesionario.id
                  return (
                    <li key={concesionario.id}>
                      <button
                        type="button"
                        onClick={() => seleccionar(concesionario)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                          activo
                            ? 'border-mm-yellow bg-mm-gray-700'
                            : 'border-mm-gray-700 bg-mm-gray-900 hover:bg-mm-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {concesionario.nombre}
                          </p>
                          <BadgeEstado estado={concesionario.estado} />
                        </div>
                        <p className="mt-0.5 text-xs text-mm-gray-400">
                          {concesionario.ciudad} · {concesionario.departamento}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
        </>
      )}

      <ConcesionarioModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={() => {
          setModalAbierto(false)
          setSeleccionado(null)
          recargar()
        }}
      />

      <DetalleConcesionarioModal concesionario={detalle} onCerrar={() => setDetalle(null)} />
    </div>
  )
}

export default DashboardConcesionarios
