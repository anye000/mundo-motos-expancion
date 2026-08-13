/**
 * Modelo de datos del módulo Expansiones.
 *
 * Los campos reflejan la tabla `expansiones` (ver
 * src/database/migrations/003_expansiones.sql). Se usa snake_case para
 * alinear directamente con las columnas de Supabase.
 */

export type EstadoExpansion = 'proximo' | 'en_ejecucion' | 'completado';

export type TipoExpansion = 'apertura' | 'ampliacion' | 'relocalizacion' | 'otro';

/** Fila completa de la tabla `expansiones` devuelta por Supabase. */
export interface Expansion {
  id: string;
  concesionario: string;
  locacion: string;
  fecha_apertura: string;
  estado: EstadoExpansion;
  tipo: string;
  ciudad: string;
  departamento: string;
  avance: number;
  latitud: number | null;
  longitud: number | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Campos requeridos para crear una expansión. */
export interface CreateExpansionInput {
  concesionario: string;
  locacion?: string;
  fecha_apertura: string;
  estado?: EstadoExpansion;
  tipo?: string;
  ciudad?: string;
  departamento?: string;
  avance?: number;
  latitud?: number | null;
  longitud?: number | null;
  observaciones?: string | null;
}

/** Campos actualizables (parciales) de una expansión. */
export interface UpdateExpansionInput {
  concesionario?: string;
  locacion?: string;
  fecha_apertura?: string;
  estado?: EstadoExpansion;
  tipo?: string;
  ciudad?: string;
  departamento?: string;
  avance?: number;
  latitud?: number | null;
  longitud?: number | null;
  observaciones?: string | null;
}

/** Filtros soportados por GET /api/v1/expansiones. */
export interface ExpansionFilters {
  estado?: EstadoExpansion;
  locacion?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

/** Resultado paginado devuelto por el servicio. */
export interface PaginatedExpansiones {
  data: Expansion[];
  total: number;
  page: number;
  limit: number;
}
