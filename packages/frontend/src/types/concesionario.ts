/** Tipos del módulo Concesionarios alineados con el backend (snake_case). */

export type EstadoOperativo = 'activo' | 'inactivo';

export interface Concesionario {
  id: string;
  nombre: string;
  razon_social: string;
  nit: string;
  email: string;
  telefono: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id: string | null;
  estado: EstadoOperativo;
  metadatos: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateConcesionarioInput {
  nombre: string;
  razon_social: string;
  nit: string;
  email: string;
  telefono?: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  metadatos?: Record<string, unknown> | null;
}

export interface UpdateConcesionarioInput {
  nombre?: string;
  razon_social?: string;
  nit?: string;
  email?: string;
  telefono?: string | null;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  metadatos?: Record<string, unknown> | null;
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
