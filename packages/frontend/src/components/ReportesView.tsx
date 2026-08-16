import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  endOfMonth,
  endOfYear,
  format,
  max,
  min,
  parseISO,
  startOfMonth,
  startOfYear,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart3, Download, FilterX, Loader2 } from 'lucide-react'
import { useConcesionarios } from '@hooks/useConcesionarios'
import { useReportes } from '@hooks/useReportes'
import { apiService } from '@services/api'
import { EstadoOperativo } from '../types/concesionario'
import { EstadoExpansion } from '../types/expansion'
import { TipoInteraccion } from '../types/interaccion'
import { Usuario } from '../types/usuario'
import { ReporteFilters } from '../types/reporte'

const TIPO_INTERACCION_LABEL: Record<TipoInteraccion, string> = {
  llamada: 'Llamada',
  visita: 'Visita',
  nota_rapida: 'Nota rápida',
  incidencia: 'Incidencia',
}

const ESTADO_EXPANSION_LABEL: Record<EstadoExpansion, string> = {
  proximo: 'Próximo',
  en_ejecucion: 'En ejecución',
  completado: 'Completado',
}

const MESES_2026 = Array.from({ length: 12 }, (_, i) => i + 1)

interface FiltrosReportes {
  concesionario_id: string
  estado: EstadoOperativo | ''
  ciudad: string
  fechaDesde: string
  fechaHasta: string
  mesDesde: string
  mesHasta: string
}

const FILTROS_INICIALES: FiltrosReportes = {
  concesionario_id: '',
  estado: '',
  ciudad: '',
  fechaDesde: '',
  fechaHasta: '',
  mesDesde: '',
  mesHasta: '',
}

type Pestana = 'interacciones' | 'aperturas' | 'rendimiento'

interface ColumnaCSV {
  clave: string
  encabezado: string
}

function TablaReporte({
  columnas,
  filas,
  vacio,
}: {
  columnas: ColumnaCSV[]
  filas: Record<string, unknown>[]
  vacio: string
}) {
  if (filas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-mm-gray-700 bg-mm-gray-900 py-10 text-center text-sm text-mm-gray-400">
        {vacio}
      </p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-mm-gray-700 bg-mm-gray-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-mm-gray-700 bg-mm-gray-900 text-xs uppercase tracking-wider text-mm-gray-400">
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} className="px-3 py-2.5 font-semibold">
                {c.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-mm-gray-700">
          {filas.map((fila, indice) => (
            <tr key={indice} className="transition-colors hover:bg-mm-gray-900">
              {columnas.map((c) => (
                <td key={c.clave} className="px-3 py-2.5 text-mm-gray-200">
                  {String(fila[c.clave] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReportesView() {
  const {
    concesionarios,
    ciudades,
    cargando: cargandoConcesionarios,
    error: errorConcesionarios,
    recargar: recargarConcesionarios,
  } = useConcesionarios()
  const [filtros, setFiltros] = useState<FiltrosReportes>(FILTROS_INICIALES)
  const [pestana, setPestana] = useState<Pestana>('interacciones')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    let activo = true
    apiService
      .getUsuarios()
      .then((lista) => {
        if (activo) setUsuarios(lista)
      })
      .catch(() => undefined)
    return () => {
      activo = false
    }
  }, [])

  const limites = useMemo(() => {
    const desdeFecha = filtros.fechaDesde ? parseISO(filtros.fechaDesde) : null
    const hastaFecha = filtros.fechaHasta ? parseISO(filtros.fechaHasta) : null
    const desdeMes = filtros.mesDesde
      ? startOfMonth(new Date(2026, Number(filtros.mesDesde) - 1, 1))
      : null
    const hastaMes = filtros.mesHasta
      ? endOfMonth(new Date(2026, Number(filtros.mesHasta) - 1, 1))
      : null
    const candidatosDesde = [desdeFecha, desdeMes].filter((d): d is Date => d !== null)
    const candidatosHasta = [hastaFecha, hastaMes].filter((d): d is Date => d !== null)
    let desdeFinal =
      candidatosDesde.length > 0 ? max(candidatosDesde) : startOfYear(new Date(2026, 0, 1))
    let hastaFinal =
      candidatosHasta.length > 0 ? min(candidatosHasta) : endOfYear(new Date(2026, 0, 1))
    if (desdeFinal.getTime() > hastaFinal.getTime()) {
      const temporal = desdeFinal
      desdeFinal = hastaFinal
      hastaFinal = temporal
    }
    return {
      fecha_desde: format(desdeFinal, 'yyyy-MM-dd'),
      fecha_hasta: format(hastaFinal, 'yyyy-MM-dd'),
    }
  }, [filtros.fechaDesde, filtros.fechaHasta, filtros.mesDesde, filtros.mesHasta])

  const filtrosApi = useMemo<ReporteFilters>(
    () => ({
      concesionario_id: filtros.concesionario_id || undefined,
      estado: filtros.estado || undefined,
      ciudad: filtros.ciudad || undefined,
      fecha_desde: limites.fecha_desde,
      fecha_hasta: limites.fecha_hasta,
    }),
    [filtros.concesionario_id, filtros.estado, filtros.ciudad, limites.fecha_desde, limites.fecha_hasta]
  )

  const { datos, cargando, error, recargar } = useReportes(filtrosApi)

  const cambiarFiltro = (campo: keyof FiltrosReportes, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  const limpiarFiltros = () => setFiltros(FILTROS_INICIALES)

  const nombreResponsable = (id: string): string => {
    const usuario = usuarios.find((u) => u.id === id)
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '—'
  }

  const filasInteracciones = useMemo(
    () =>
      (datos?.interacciones ?? []).map((i) => ({
        fecha: format(new Date(i.created_at), 'dd/MM/yyyy HH:mm'),
        tipo: TIPO_INTERACCION_LABEL[i.tipo],
        concesionario_nombre: i.concesionario_nombre,
        concesionario_ciudad: i.concesionario_ciudad,
        concesionario_estado: i.concesionario_estado,
        detalles: i.detalles,
        responsable: nombreResponsable(i.usuario_responsable),
      })),
    [datos, usuarios]
  )

  const filasAperturas = useMemo(
    () =>
      (datos?.aperturas ?? []).map((e) => ({
        concesionario: e.concesionario,
        locacion: e.locacion,
        fecha_apertura: format(parseISO(e.fecha_apertura), 'dd/MM/yyyy'),
        estado: ESTADO_EXPANSION_LABEL[e.estado],
        avance: `${e.avance}%`,
        observaciones: e.observaciones ?? '',
      })),
    [datos]
  )

  const filasRendimiento = useMemo(
    () =>
      (datos?.rendimiento ?? []).map((r) => ({
        nombre: r.nombre,
        ciudad: r.ciudad,
        departamento: r.departamento,
        estado: r.estado,
        total_interacciones: r.total_interacciones,
        ultima_interaccion: r.ultima_interaccion
          ? format(new Date(r.ultima_interaccion), 'dd/MM/yyyy HH:mm')
          : '—',
        aperturas_programadas: r.aperturas_programadas,
        aperturas_completadas: r.aperturas_completadas,
        aperturas_en_ejecucion: r.aperturas_en_ejecucion,
        avance_promedio: `${r.avance_promedio.toFixed(1)}%`,
      })),
    [datos]
  )

  const columnasInteracciones: ColumnaCSV[] = [
    { clave: 'fecha', encabezado: 'Fecha' },
    { clave: 'tipo', encabezado: 'Tipo' },
    { clave: 'concesionario_nombre', encabezado: 'Concesionario' },
    { clave: 'concesionario_ciudad', encabezado: 'Ciudad' },
    { clave: 'concesionario_estado', encabezado: 'Estado' },
    { clave: 'detalles', encabezado: 'Detalles' },
    { clave: 'responsable', encabezado: 'Responsable' },
  ]
  const columnasAperturas: ColumnaCSV[] = [
    { clave: 'concesionario', encabezado: 'Concesionario' },
    { clave: 'locacion', encabezado: 'Locación' },
    { clave: 'fecha_apertura', encabezado: 'Fecha apertura' },
    { clave: 'estado', encabezado: 'Estado' },
    { clave: 'avance', encabezado: 'Avance' },
    { clave: 'observaciones', encabezado: 'Observaciones' },
  ]
  const columnasRendimiento: ColumnaCSV[] = [
    { clave: 'nombre', encabezado: 'Concesionario' },
    { clave: 'ciudad', encabezado: 'Ciudad' },
    { clave: 'departamento', encabezado: 'Departamento' },
    { clave: 'estado', encabezado: 'Estado' },
    { clave: 'total_interacciones', encabezado: 'Interacciones' },
    { clave: 'ultima_interaccion', encabezado: 'Última interacción' },
    { clave: 'aperturas_programadas', encabezado: 'Aperturas programadas' },
    { clave: 'aperturas_completadas', encabezado: 'Aperturas completadas' },
    { clave: 'aperturas_en_ejecucion', encabezado: 'En ejecución' },
    { clave: 'avance_promedio', encabezado: 'Avance promedio' },
  ]

  function descargarCSV(
    nombreArchivo: string,
    columnas: ColumnaCSV[],
    filas: Record<string, unknown>[]
  ) {
    if (filas.length === 0) {
      toast.error('No hay datos que coincidan con los filtros para exportar')
      return
    }
    const escapar = (valor: unknown): string => {
      const texto = String(valor ?? '')
      return `"${texto.replace(/"/g, '""')}"`
    }
    const lineas = [
      columnas.map((c) => c.encabezado).join(';'),
      ...filas.map((fila) => columnas.map((c) => escapar(fila[c.clave])).join(';')),
    ]
    const blob = new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    URL.revokeObjectURL(url)
    toast.success('Reporte CSV exportado')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mm-yellow">
          Mundo Motos · Reportes Avanzados
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Reportes <span className="text-mm-yellow">2026</span>
        </h2>
        <p className="text-sm text-mm-gray-400">
          Filtra interacciones, aperturas y rendimiento comercial por concesionario, estado,
          ciudad y rangos de semanas/meses del año 2026.
        </p>
      </section>

      {/* Filtros */}
      <section className="rounded-xl border border-mm-gray-700 bg-mm-gray-800 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <BarChart3 className="h-4 w-4 text-mm-yellow" />
            Filtros del reporte
          </h3>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="flex items-center gap-1.5 rounded-lg border border-mm-gray-600 px-3 py-1.5 text-xs font-semibold text-mm-gray-300 transition-colors hover:bg-mm-gray-700 hover:text-white"
          >
            <FilterX className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">Concesionario</span>
            <select
              className="input-dark"
              value={filtros.concesionario_id}
              onChange={(e) => cambiarFiltro('concesionario_id', e.target.value)}
            >
              <option value="">Todos</option>
              {concesionarios.length === 0 && cargandoConcesionarios && (
                <option value="">Cargando...</option>
              )}
              {concesionarios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">Estado</span>
            <select
              className="input-dark"
              value={filtros.estado}
              onChange={(e) => cambiarFiltro('estado', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">Ciudad</span>
            <select
              className="input-dark"
              value={filtros.ciudad}
              onChange={(e) => cambiarFiltro('ciudad', e.target.value)}
            >
              <option value="">Todas</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">
                Semana desde
              </span>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => cambiarFiltro('fechaDesde', e.target.value)}
                className="rounded-lg border border-mm-yellow/60 bg-black px-3 py-2 text-sm text-white outline-none transition-colors focus:border-mm-yellow [color-scheme:dark]"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">Semana hasta</span>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => cambiarFiltro('fechaHasta', e.target.value)}
                className="rounded-lg border border-mm-yellow/60 bg-black px-3 py-2 text-sm text-white outline-none transition-colors focus:border-mm-yellow [color-scheme:dark]"
              />
            </label>
          </div>
          <div className="flex items-end gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">Mes desde</span>
              <select
                className="input-dark"
                value={filtros.mesDesde}
                onChange={(e) => cambiarFiltro('mesDesde', e.target.value)}
              >
                <option value="">—</option>
                {MESES_2026.map((m) => (
                  <option key={m} value={String(m)}>
                    {format(new Date(2026, m - 1, 1), 'MMMM', { locale: es })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-mm-gray-400">Mes hasta</span>
              <select
                className="input-dark"
                value={filtros.mesHasta}
                onChange={(e) => cambiarFiltro('mesHasta', e.target.value)}
              >
                <option value="">—</option>
                {MESES_2026.map((m) => (
                  <option key={m} value={String(m)}>
                    {format(new Date(2026, m - 1, 1), 'MMMM', { locale: es })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-mm-gray-400 sm:col-span-2 lg:col-span-2">
            Rango aplicado: del {limites.fecha_desde} al {limites.fecha_hasta}.
          </p>
        </div>
      </section>

      {errorConcesionarios && (
        <div className="flex items-center justify-between rounded-xl border border-mm-error/40 bg-mm-error/10 px-4 py-3">
          <p className="text-sm text-mm-error">{errorConcesionarios}</p>
          <button
            type="button"
            onClick={recargarConcesionarios}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error transition-colors hover:bg-mm-error/10"
          >
            Reintentar
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-mm-error/40 bg-mm-error/10 px-4 py-3">
          <p className="text-sm text-mm-error">{error}</p>
          <button
            type="button"
            onClick={recargar}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error transition-colors hover:bg-mm-error/10"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Pestañas + exportar */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-xl border border-mm-gray-700 bg-mm-gray-800 p-1">
            {(
              [
                ['interacciones', 'Interacciones'],
                ['aperturas', 'Aperturas'],
                ['rendimiento', 'Rendimiento'],
              ] as [Pestana, string][]
            ).map(([clave, etiqueta]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setPestana(clave)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  pestana === clave
                    ? 'bg-mm-yellow text-mm-black'
                    : 'text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (pestana === 'interacciones') {
                descargarCSV('reporte-interacciones.csv', columnasInteracciones, filasInteracciones)
              } else if (pestana === 'aperturas') {
                descargarCSV('reporte-aperturas.csv', columnasAperturas, filasAperturas)
              } else {
                descargarCSV('reporte-rendimiento.csv', columnasRendimiento, filasRendimiento)
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-mm-yellow px-4 py-2 text-xs font-bold text-mm-black transition-colors hover:bg-mm-yellow-dark"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-mm-gray-700 bg-mm-gray-800 px-4 py-12 text-sm text-mm-gray-300">
            <Loader2 className="h-5 w-5 animate-spin text-mm-yellow" />
            Cargando reporte...
          </div>
        ) : pestana === 'interacciones' ? (
          <TablaReporte
            columnas={columnasInteracciones}
            filas={filasInteracciones}
            vacio="No hay interacciones que coincidan con los filtros."
          />
        ) : pestana === 'aperturas' ? (
          <TablaReporte
            columnas={columnasAperturas}
            filas={filasAperturas}
            vacio="No hay aperturas que coincidan con los filtros."
          />
        ) : (
          <TablaReporte
            columnas={columnasRendimiento}
            filas={filasRendimiento}
            vacio="No hay concesionarios que coincidan con los filtros."
          />
        )}
      </section>
    </div>
  )
}

export default ReportesView
