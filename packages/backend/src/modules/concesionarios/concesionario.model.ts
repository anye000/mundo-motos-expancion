/**
 * Modelo de datos del módulo Concesionarios.
 *
 * Los campos reflejan la tabla `concesionarios` (ver
 * docs/base-de-datos.md y src/database/migrations/001_concesionarios.sql).
 * Se usa snake_case para alinear directamente con las columnas de Supabase.
 */

export type EstadoOperativo =
  | 'en_negociacion'
  | 'proximo'
  | 'en_ejecucion'
  | 'activo'
  | 'inactivo'
  | 'rechazado'
  | 'completado';

export type TipoExpansion = 'apertura' | 'ampliacion' | 'relocalizacion' | 'otro';

/** Fila completa de la tabla `concesionarios` devuelta por Supabase. */
export interface Concesionario {
  id: string;
  nombre: string;
  razon_social: string;
  rif: string;
  email: string;
  telefono: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id: string | null;
  estado: EstadoOperativo;
  fecha_apertura_programada: string | null;
  tipo_expansion: string;
  metadatos: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Campos requeridos para crear un concesionario. */
export interface CreateConcesionarioInput {
  nombre: string;
  razon_social: string;
  rif: string;
  email: string;
  telefono?: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  fecha_apertura_programada?: string | null;
  tipo_expansion?: TipoExpansion;
  metadatos?: Record<string, unknown> | null;
}

/** Campos actualizables (parciales) de un concesionario. */
export interface UpdateConcesionarioInput {
  nombre?: string;
  razon_social?: string;
  rif?: string;
  email?: string;
  telefono?: string | null;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  fecha_apertura_programada?: string | null;
  tipo_expansion?: TipoExpansion;
  metadatos?: Record<string, unknown> | null;
}

/** Filtros soportados por GET /api/v1/concesionarios. */
export interface ConcesionarioFilters {
  estado?: EstadoOperativo;
  ciudad?: string;
  departamento?: string;
  page?: number;
  limit?: number;
}

/** Resultado paginado devuelto por el servicio. */
export interface PaginatedConcesionarios {
  data: Concesionario[];
  total: number;
  page: number;
  limit: number;
}

/** Entrada del historial de estados de un concesionario. */
export interface HistorialEstado {
  id: string;
  concesionario_id: string;
  estado_anterior: EstadoOperativo | null;
  estado_nuevo: EstadoOperativo;
  created_at: string;
}
