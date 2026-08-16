/** Configuración central de los estados operativos de concesionarios (UI). */

import { EstadoOperativo } from '../types/concesionario'

/** Orden lógico del ciclo de vida de un concesionario para selectores y filtros. */
export const ORDEN_ESTADOS: EstadoOperativo[] = [
  'en_negociacion',
  'proximo',
  'en_ejecucion',
  'activo',
  'inactivo',
  'rechazado',
  'completado',
]

export const ESTADO_LABEL: Record<EstadoOperativo, string> = {
  en_negociacion: 'En negociación',
  proximo: 'Próximo',
  en_ejecucion: 'En ejecución',
  activo: 'Activo',
  inactivo: 'Inactivo',
  rechazado: 'Rechazado',
  completado: 'Completado',
}

/** Clases de badge con la paleta corporativa estricta (negro/amarillo/blanco/grises, cero azul o cian). */
export const ESTADO_BADGE: Record<EstadoOperativo, string> = {
  en_negociacion: 'bg-mm-yellow/15 text-mm-yellow border-mm-yellow/30',
  proximo: 'bg-mm-warning/15 text-mm-warning border-mm-warning/30',
  en_ejecucion: 'bg-mm-warning/15 text-mm-warning border-mm-warning/30',
  activo: 'bg-mm-success/15 text-mm-success border-mm-success/30',
  inactivo: 'bg-mm-gray-700/50 text-mm-gray-300 border-mm-gray-500/40',
  rechazado: 'bg-mm-error/15 text-mm-error border-mm-error/30',
  completado: 'bg-mm-success/15 text-mm-success border-mm-success/30',
}

/** Colores para gráficos (recharts), alineados con la paleta corporativa. */
export const ESTADO_COLOR: Record<EstadoOperativo, string> = {
  en_negociacion: '#FFCC00',
  proximo: '#E6B800',
  en_ejecucion: '#FFD633',
  activo: '#10B981',
  inactivo: '#A3A3A3',
  rechazado: '#EF4444',
  completado: '#10B981',
}