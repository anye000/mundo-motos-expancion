import { useCallback, useMemo, useState } from 'react'
import { parseISO } from 'date-fns'
import { Concesionario, EstadoOperativo } from '../../types/concesionario'
import { Expansion } from '../../types/expansion'
import { agruparPorPeriodo, clavePeriodo, DatosBarra } from './formateo'
import { calcularKpis, datosPieEstado, DatosPie, KpisDashboard } from './kpis'
import { ORDEN_ESTADOS } from '@utils/estadosConcesionario'

export type EstadoFiltro = EstadoOperativo | null

export interface FiltrosDashboard {
  desde: Date | null
  hasta: Date | null
  estado: EstadoFiltro
  mes: string | null
}

const SIN_FILTROS: FiltrosDashboard = { desde: null, hasta: null, estado: null, mes: null }

export interface UseFiltrosDashboardReturn {
  filtros: FiltrosDashboard
  concesionariosFiltrados: Concesionario[]
  expansionesFiltradas: Expansion[]
  kpis: KpisDashboard
  datosPie: DatosPie[]
  datosBarras: DatosBarra[]
  totalBarras: number
  hayFiltros: boolean
  cambiarRango: (desde: Date | null, hasta: Date | null) => void
  seleccionarEstado: (estado: string | null) => void
  seleccionarMes: (clave: string | null) => void
  limpiarFiltros: () => void
}

function enRango(fecha: string, desde: Date | null, hasta: Date | null): boolean {
  if (!desde && !hasta) return true
  const f = parseISO(fecha)
  if (Number.isNaN(f.getTime())) return true
  if (desde && f.getTime() < desde.getTime()) return false
  if (hasta && f.getTime() > hasta.getTime()) return false
  return true
}

function enPeriodo(fechaISO: string, clave: string): boolean {
  const porAnio = /^\d{4}$/.test(clave)
  const f = parseISO(fechaISO)
  return clavePeriodo(f, porAnio) === clave
}

export function useFiltrosDashboard(
  concesionarios: Concesionario[],
  expansiones: Expansion[]
): UseFiltrosDashboardReturn {
  const [filtros, setFiltros] = useState<FiltrosDashboard>(SIN_FILTROS)

  const hayFiltros =
    filtros.desde != null || filtros.hasta != null || filtros.estado != null || filtros.mes != null

  // 1) Filtro por rango de fechas sobre aperturas programadas / aperturas.
  const porFecha = useMemo(() => {
    const conRango = filtros.desde != null || filtros.hasta != null
    const concesionariosFiltrados = conRango
      ? concesionarios.filter(
          (c) =>
            c.fecha_apertura_programada != null &&
            enRango(c.fecha_apertura_programada, filtros.desde, filtros.hasta)
        )
      : concesionarios
    const expansionesFiltradas = conRango
      ? expansiones.filter((e) => enRango(e.fecha_apertura, filtros.desde, filtros.hasta))
      : expansiones
    return { concesionariosFiltrados, expansionesFiltradas }
  }, [concesionarios, expansiones, filtros.desde, filtros.hasta])

  // 2) Mapa concesionario_id -> estado operativo (base para el cross-filter).
  const mapaEstados = useMemo(() => {
    const mapa = new Map<string, Concesionario['estado']>()
    for (const c of porFecha.concesionariosFiltrados) mapa.set(c.id, c.estado)
    return mapa
  }, [porFecha.concesionariosFiltrados])

  // 3) Filtro por estado operativo (afecta a ambos datasets).
  const conEstado = useMemo(() => {
    let concesionariosFiltrados = porFecha.concesionariosFiltrados
    let expansionesFiltradas = porFecha.expansionesFiltradas
    if (filtros.estado) {
      concesionariosFiltrados = concesionariosFiltrados.filter((c) => c.estado === filtros.estado)
      expansionesFiltradas = expansionesFiltradas.filter(
        (e) => e.concesionario_id != null && mapaEstados.get(e.concesionario_id) === filtros.estado
      )
    }
    return { concesionariosFiltrados, expansionesFiltradas }
  }, [porFecha, mapaEstados, filtros.estado])

  // 4) Filtro por mes/año (afecta a ambos datasets).
  const datasetsFiltrados = useMemo(() => {
    let concesionariosFiltrados = conEstado.concesionariosFiltrados
    let expansionesFiltradas = conEstado.expansionesFiltradas
    if (filtros.mes) {
      concesionariosFiltrados = concesionariosFiltrados.filter(
        (c) => c.fecha_apertura_programada != null && enPeriodo(c.fecha_apertura_programada, filtros.mes as string)
      )
      expansionesFiltradas = expansionesFiltradas.filter((e) => enPeriodo(e.fecha_apertura, filtros.mes as string))
    }
    return { concesionariosFiltrados, expansionesFiltradas }
  }, [conEstado, filtros.mes])

  // 5) KPIs y derivaciones sobre datasets filtrados.
  const kpis = useMemo(
    () => calcularKpis(datasetsFiltrados.concesionariosFiltrados, datasetsFiltrados.expansionesFiltradas),
    [datasetsFiltrados]
  )

  // Dona: concesionarios con todos los filtros excepto el de estado.
  const concesionariosParaPie = useMemo(() => {
    let base = porFecha.concesionariosFiltrados
    if (filtros.mes) {
      base = base.filter(
        (c) => c.fecha_apertura_programada != null && enPeriodo(c.fecha_apertura_programada, filtros.mes as string)
      )
    }
    return base
  }, [porFecha.concesionariosFiltrados, filtros.mes])

  const datosPie = useMemo(() => datosPieEstado(concesionariosParaPie), [concesionariosParaPie])

  // Barras: expansiones con todos los filtros excepto el de mes.
  const expansionesParaBarras = useMemo(() => conEstado.expansionesFiltradas, [conEstado])

  const datosBarras = useMemo(
    () => agruparPorPeriodo(expansionesParaBarras, filtros.desde, filtros.hasta),
    [expansionesParaBarras, filtros.desde, filtros.hasta]
  )
  const totalBarras = useMemo(() => datosBarras.reduce((acumulado, d) => acumulado + d.value, 0), [datosBarras])

  const cambiarRango = useCallback((desde: Date | null, hasta: Date | null) => {
    setFiltros((prev) => {
      if (desde && hasta && desde.getTime() > hasta.getTime()) {
        return { ...prev, desde: hasta, hasta: desde }
      }
      return { ...prev, desde, hasta }
    })
  }, [])

  const seleccionarEstado = useCallback((estado: string | null) => {
    setFiltros((prev) => ({
      ...prev,
      estado: estado && (ORDEN_ESTADOS as string[]).includes(estado) ? (estado as EstadoOperativo) : null,
    }))
  }, [])

  const seleccionarMes = useCallback((clave: string | null) => {
    setFiltros((prev) => ({ ...prev, mes: clave }))
  }, [])

  const limpiarFiltros = useCallback(() => setFiltros(SIN_FILTROS), [])

  return {
    filtros,
    concesionariosFiltrados: datasetsFiltrados.concesionariosFiltrados,
    expansionesFiltradas: datasetsFiltrados.expansionesFiltradas,
    kpis,
    datosPie,
    datosBarras,
    totalBarras,
    hayFiltros,
    cambiarRango,
    seleccionarEstado,
    seleccionarMes,
    limpiarFiltros,
  }
}