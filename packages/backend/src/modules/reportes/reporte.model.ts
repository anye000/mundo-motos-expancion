/**
 * Modelo de datos del módulo Reportes.
 *
 * Tipos del endpoint GET /api/v1/reportes que combina concesionarios,
 * interacciones CRM y expansiones del plan en una sola respuesta.
 * Se usa snake_case para alinear directamente con las columnas de Supabase.
 */

import { Concesionario, EstadoOperativo } from '../concesionarios/concesionario.model';
import { InteraccionCrm } from '../crm/crm.model';
import { Expansion } from '../expansiones/expansion.model';

/** Filtros soportados por GET /api/v1/reportes. */
export interface ReporteFilters {
  concesionario_id?: string;
  estado?: EstadoOperativo;
  ciudad?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

/** Interacción enriquecida con datos del concesionario para la tabla de reportes. */
export interface InteraccionReporte extends InteraccionCrm {
  concesionario_nombre: string;
  concesionario_ciudad: string;
  concesionario_estado: EstadoOperativo;
}

/** Fila de rendimiento comercial agregada por concesionario. */
export interface FilaRendimiento {
  concesionario_id: string;
  nombre: string;
  ciudad: string;
  departamento: string;
  estado: EstadoOperativo;
  total_interacciones: number;
  ultima_interaccion: string | null;
  aperturas_programadas: number;
  aperturas_completadas: number;
  aperturas_en_ejecucion: number;
  avance_promedio: number;
}

/** Respuesta completa de GET /api/v1/reportes. */
export interface ReporteData {
  concesionarios: Concesionario[];
  interacciones: InteraccionReporte[];
  aperturas: Expansion[];
  rendimiento: FilaRendimiento[];
}
