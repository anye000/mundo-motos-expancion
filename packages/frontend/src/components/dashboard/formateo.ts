import { differenceInCalendarDays, format, parseISO, startOfDay, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Expansion } from '../../types/expansion'

export interface DatosBarra {
  clave: string
  nombre: string
  value: number
}

const DIAS_ANIO = 366

export function cuentaRegresiva(fechaApertura: string): string {
  const dias = differenceInCalendarDays(parseISO(fechaApertura), startOfDay(new Date()))
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias > 1) return `en ${dias} días`
  const pasados = Math.abs(dias)
  return pasados === 1 ? 'hace 1 día' : `hace ${pasados} días`
}

export function clavePeriodo(fecha: Date, porAnio: boolean): string {
  return porAnio ? String(fecha.getFullYear()) : format(fecha, 'yyyy-MM')
}

export function agruparPorPeriodo(
  expansiones: Expansion[],
  desde: Date | null,
  hasta: Date | null
): DatosBarra[] {
  const fechas = expansiones
    .map((e) => parseISO(e.fecha_apertura))
    .filter((f) => !Number.isNaN(f.getTime()))

  if (fechas.length === 0) return []

  const minimos = fechas.map((f) => f.getTime())
  let min = desde ?? new Date(Math.min(...minimos))
  let max = hasta ?? new Date(Math.max(...minimos))
  if (min.getTime() > max.getTime()) {
    ;[min, max] = [max, min]
  }
  const porAnio = differenceInCalendarDays(max, min) > DIAS_ANIO

  const conteo = new Map<string, number>()
  for (const f of fechas) {
    const clave = clavePeriodo(f, porAnio)
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
  }

  const datos: DatosBarra[] = []
  if (porAnio) {
    for (let anio = min.getFullYear(); anio <= max.getFullYear(); anio++) {
      const clave = String(anio)
      datos.push({ clave, nombre: clave, value: conteo.get(clave) ?? 0 })
    }
  } else {
    const cursor = startOfMonth(min)
    const fin = startOfMonth(max)
    while (cursor <= fin) {
      const clave = format(cursor, 'yyyy-MM')
      datos.push({
        clave,
        nombre: format(cursor, 'MMM yyyy', { locale: es }),
        value: conteo.get(clave) ?? 0,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }
  return datos
}
