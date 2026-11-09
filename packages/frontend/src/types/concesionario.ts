/** Tipos del módulo Concesionarios alineados con el backend (snake_case). */

export type EstadoOperativo =
  | 'en_negociacion'
  | 'proximo'
  | 'en_ejecucion'
  | 'activo'
  | 'inactivo'
  | 'rechazado'
  | 'completado';

export type TipoExpansion = 'apertura' | 'ampliacion' | 'relocalizacion' | 'otro';

/** Niveles de inversión habilitados para el plan de expansión 2026. */
export type TipoInversion = 'Lite-25K' | 'Mid-35K' | 'Max-50K';

/** Hito individual del control de apertura por etapas. */
export interface HitoApertura {
  hito: string;
  completado: boolean;
}

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
  image_url?: string | null;
  /** Nivel de inversión asignado al concesionario (plan 2026). */
  tier_inversion: TipoInversion | null;
  /** Monto de inversión asignado (moneda local). */
  monto_inversion: number | null;
  /** Hitos de apertura completados/pendientes (etapas de la obra). */
  hitos_apertura: HitoApertura[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

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
  tier_inversion?: TipoInversion | null;
  monto_inversion?: number | null;
  hitos_apertura?: HitoApertura[] | null;
}

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
  tier_inversion?: TipoInversion | null;
  monto_inversion?: number | null;
  hitos_apertura?: HitoApertura[] | null;
}

export interface ConcesionarioFilters {
  estado?: EstadoOperativo;
  ciudad?: string;
  departamento?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedConcesionarios {
  data: Concesionario[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Coordenadas geográficas (lat/lng). */
export interface Coordenadas {
  lat: number;
  lng: number;
}

/** Entrada del historial de cambios de estado de un concesionario. */
export interface HistorialEstado {
  id: string;
  concesionario_id: string;
  estado_anterior: EstadoOperativo | null;
  estado_nuevo: EstadoOperativo;
  created_at: string;
}
