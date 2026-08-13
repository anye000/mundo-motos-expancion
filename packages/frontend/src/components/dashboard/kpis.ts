import { parseISO, startOfDay } from 'date-fns'
import { COLOR_ACTIVO, COLOR_INACTIVO } from '@utils/branding'
import { Concesionario } from '../../types/concesionario'
import { Expansion } from '../../types/expansion'

export interface DatosPie {
  name: string
  value: number
  color: string
}

export interface KpisDashboard {
  total: number
  activos: number
  inactivos: number
  proximas: number
  enEjecucion: number
  completadas: number
  departamentos: number
  porcentajeActivos: number
  meta2026: number
  completadas2026: number
  progresoMeta: number
  proximaApertura: Expansion | null
  proximasAperturas: Expansion[]
}

export function es2026(fecha: string): boolean {
  return parseISO(fecha).getFullYear() === 2026
}

export function calcularKpis(concesionarios: Concesionario[], expansiones: Expansion[]): KpisDashboard {
  const hoy = startOfDay(new Date())

  const activos = concesionarios.filter((c) => c.estado === 'activo').length
  const inactivos = concesionarios.filter((c) => c.estado === 'inactivo').length
  const proximas = expansiones.filter((e) => e.estado === 'proximo' && es2026(e.fecha_apertura)).length
  const enEjecucion = expansiones.filter((e) => e.estado === 'en_ejecucion' && es2026(e.fecha_apertura)).length
  const completadas = expansiones.filter((e) => e.estado === 'completado' && es2026(e.fecha_apertura)).length

  const meta2026 = expansiones.filter((e) => es2026(e.fecha_apertura)).length
  const completadas2026 = expansiones.filter((e) => e.estado === 'completado' && es2026(e.fecha_apertura)).length
  const progresoMeta = meta2026 > 0 ? (completadas2026 / meta2026) * 100 : 0

  const pendientes = expansiones
    .filter(
      (e) =>
        (e.estado === 'proximo' || e.estado === 'en_ejecucion') &&
        parseISO(e.fecha_apertura) >= hoy
    )
    .sort((a, b) => a.fecha_apertura.localeCompare(b.fecha_apertura))

  return {
    total: concesionarios.length,
    activos,
    inactivos,
    proximas,
    enEjecucion,
    completadas,
    departamentos: new Set(concesionarios.map((c) => c.departamento)).size,
    porcentajeActivos: concesionarios.length > 0 ? Math.round((activos / concesionarios.length) * 100) : 0,
    meta2026,
    completadas2026,
    progresoMeta,
    proximaApertura: pendientes[0] ?? null,
    proximasAperturas: pendientes.slice(0, 3),
  }
}

export function datosPieEstado(concesionarios: Concesionario[]): DatosPie[] {
  const activos = concesionarios.filter((c) => c.estado === 'activo').length
  const inactivos = concesionarios.filter((c) => c.estado === 'inactivo').length
  return [
    { name: 'Activos', value: activos, color: COLOR_ACTIVO },
    { name: 'Inactivos', value: inactivos, color: COLOR_INACTIVO },
  ]
}
