/** Tipos del módulo Reportes alineados con el backend (snake_case). */

import { Concesionario, EstadoOperativo } from './concesionario'
import { InteraccionCrm } from './interaccion'
import { Expansion } from './expansion'

export interface ReporteFilters {
  concesionario_id?: string
  estado?: EstadoOperativo
  ciudad?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface InteraccionReporte extends InteraccionCrm {
  concesionario_nombre: string
  concesionario_ciudad: string
  concesionario_estado: EstadoOperativo
}

export interface FilaRendimiento {
  concesionario_id: string
  nombre: string
  ciudad: string
  departamento: string
  estado: EstadoOperativo
  total_interacciones: number
  ultima_interaccion: string | null
  aperturas_programadas: number
  aperturas_completadas: number
  aperturas_en_ejecucion: number
  avance_promedio: number
}

export interface ReporteData {
  concesionarios: Concesionario[]
  interacciones: InteraccionReporte[]
  aperturas: Expansion[]
  rendimiento: FilaRendimiento[]
}
