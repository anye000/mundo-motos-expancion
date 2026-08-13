/** Tipos del módulo Expansiones alineados con el backend (snake_case). */

export type EstadoExpansion = 'proximo' | 'en_ejecucion' | 'completado';

export interface Expansion {
  id: string;
  concesionario: string;
  locacion: string;
  fecha_apertura: string;
  estado: EstadoExpansion;
  avance: number;
  latitud: number | null;
  longitud: number | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateExpansionInput {
  concesionario: string;
  locacion: string;
  fecha_apertura: string;
  estado?: EstadoExpansion;
  avance?: number;
  latitud?: number | null;
  longitud?: number | null;
  observaciones?: string | null;
}

export interface UpdateExpansionInput {
  concesionario?: string;
  locacion?: string;
  fecha_apertura?: string;
  estado?: EstadoExpansion;
  avance?: number;
  latitud?: number | null;
  longitud?: number | null;
  observaciones?: string | null;
}

export interface ExpansionFilters {
  estado?: EstadoExpansion;
  locacion?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedExpansiones {
  data: Expansion[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
