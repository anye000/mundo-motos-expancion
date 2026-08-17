/**
 * Servicio del módulo CRM (interacciones con concesionarios).
 *
 * Acceso a datos sobre la tabla `interacciones_crm` mediante Supabase.
 * Lanza ApiError con códigos de estado HTTP adecuados; los controladores
 * los propagan al error handler global.
 */

import { ApiError } from '@utils/helpers';
import { mapSupabaseError } from '@utils/supabase-errors';
import { getSupabaseConToken } from '@config/supabase';
import {
  CreateInteraccionInput,
  InteraccionCrm,
  InteraccionFilters,
  PaginatedInteracciones,
  TipoInteraccion,
} from './crm.model';

const TABLE = 'interacciones_crm';
const TIPOS_VALIDOS: TipoInteraccion[] = ['llamada', 'visita', 'nota_rapida', 'incidencia'];
const LIMIT_MAX = 100;

function isTipoInteraccion(value: unknown): value is TipoInteraccion {
  return typeof value === 'string' && (TIPOS_VALIDOS as string[]).includes(value);
}

function validateRequiredString(value: unknown, campo: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(`El campo "${campo}" es requerido`, 400);
  }
  return value.trim();
}

/**
 * Obtiene el historial de interacciones de un concesionario con paginación,
 * ordenado de más reciente a más antiguo. Lanza 404 si el concesionario no
 * existe (o está con soft delete).
 */
export async function getInteraccionesByConcesionario(
  concesionarioId: string,
  filters: InteraccionFilters = {},
  token: string
): Promise<PaginatedInteracciones> {
  if (!concesionarioId) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const cliente = getSupabaseConToken(token);
  const { data: concesionario, error: errorConcesionario } = await cliente
    .from('concesionarios')
    .select('id')
    .eq('id', concesionarioId)
    .is('deleted_at', null)
    .maybeSingle();

  if (errorConcesionario) {
    throw mapSupabaseError(errorConcesionario, 'Error al obtener el concesionario');
  }
  if (!concesionario) {
    throw new ApiError('Concesionario no encontrado', 404);
  }

  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const limit =
    filters.limit && filters.limit > 0 ? Math.min(Math.floor(filters.limit), LIMIT_MAX) : 20;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = cliente
    .from(TABLE)
    .select('*', { count: 'exact' })
    .eq('concesionario_id', concesionarioId);

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(start, end)
    .returns<InteraccionCrm[]>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener las interacciones');
  }

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
  };
}

/** Registra una interacción validando los campos requeridos y el tipo. */
export async function createInteraccion(input: CreateInteraccionInput, token: string): Promise<InteraccionCrm> {
  const concesionario_id = validateRequiredString(input.concesionario_id, 'concesionario_id');
  const detalles = validateRequiredString(input.detalles, 'detalles');
  const usuario_responsable = validateRequiredString(
    input.usuario_responsable,
    'usuario_responsable'
  );

  if (!isTipoInteraccion(input.tipo)) {
    throw new ApiError(
      `Tipo de interacción inválido. Valores válidos: ${TIPOS_VALIDOS.join(', ')}`,
      400
    );
  }

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from(TABLE)
    .insert({
      concesionario_id,
      tipo: input.tipo,
      detalles,
      usuario_responsable,
    })
    .select()
    .single()
    .returns<InteraccionCrm>();

  if (error) {
    throw mapSupabaseError(error, 'Error al registrar la interacción');
  }

  return data as InteraccionCrm;
}
