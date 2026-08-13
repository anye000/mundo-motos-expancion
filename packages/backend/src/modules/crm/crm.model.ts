/**
 * Modelos del módulo CRM (interacciones con concesionarios).
 *
 * Los tipos reflejan la tabla `interacciones_crm` (snake_case) tal como la
 * devuelve Supabase. Alineado con docs/base-de-datos.md.
 */

export type TipoInteraccion = 'llamada' | 'visita' | 'nota_rapida' | 'incidencia';

export interface InteraccionCrm {
  id: string;
  concesionario_id: string;
  tipo: TipoInteraccion;
  detalles: string;
  usuario_responsable: string;
  created_at: string;
}

export interface CreateInteraccionInput {
  concesionario_id: string;
  tipo: TipoInteraccion;
  detalles: string;
  usuario_responsable: string;
}

export interface InteraccionFilters {
  tipo?: TipoInteraccion;
  page?: number;
  limit?: number;
}

export interface PaginatedInteracciones {
  data: InteraccionCrm[];
  total: number;
  page: number;
  limit: number;
}
