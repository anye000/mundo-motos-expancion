/**
 * Servicio del módulo Expansiones.
 *
 * Toda la lógica de negocio y acceso a datos sobre la tabla `expansiones`
 * mediante el cliente de Supabase. Lanza ApiError con códigos de estado
 * HTTP adecuados; los controladores los propagan al error handler global.
 */

import { ApiError } from '@utils/helpers';
import { mapSupabaseError } from '@utils/supabase-errors';
import { supabase } from '@config/supabase';
import {
  Expansion,
  CreateExpansionInput,
  UpdateExpansionInput,
  ExpansionFilters,
  PaginatedExpansiones,
  EstadoExpansion,
} from './expansion.model';

const TABLE = 'expansiones';
const ESTADOS_VALIDOS: EstadoExpansion[] = ['proximo', 'en_ejecucion', 'completado'];
const LIMIT_MAX = 100;
const AVANCE_MIN = 0;
const AVANCE_MAX = 100;

function isEstadoExpansion(value: unknown): value is EstadoExpansion {
  return typeof value === 'string' && (ESTADOS_VALIDOS as string[]).includes(value);
}

function validateRequiredString(value: unknown, campo: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(`El campo "${campo}" es requerido`, 400);
  }
  return value.trim();
}

function validateFecha(value: unknown, campo: string): string {
  if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(Date.parse(value))) {
    throw new ApiError(`El campo "${campo}" debe ser una fecha válida (YYYY-MM-DD)`, 400);
  }
  return value.trim();
}

function validateAvance(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ApiError('El campo "avance" debe ser un número', 400);
  }
  if (value < AVANCE_MIN || value > AVANCE_MAX) {
    throw new ApiError(`El campo "avance" debe estar entre ${AVANCE_MIN} y ${AVANCE_MAX}`, 400);
  }
  return Math.floor(value);
}

function validateCoordenada(value: unknown, campo: string, min: number, max: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ApiError(`El campo "${campo}" debe ser un número`, 400);
  }
  if (value < min || value > max) {
    throw new ApiError(`El campo "${campo}" debe estar entre ${min} y ${max}`, 400);
  }
  return value;
}

/**
 * Obtiene las expansiones con filtros opcionales por estado, locación y rango
 * de fechas de apertura, con paginación. Excluye registros con soft delete.
 */
export async function getExpansiones(filters: ExpansionFilters = {}): Promise<PaginatedExpansiones> {
  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const limit =
    filters.limit && filters.limit > 0 ? Math.min(Math.floor(filters.limit), LIMIT_MAX) : 20;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase.from(TABLE).select('*', { count: 'exact' }).eq('deleted_at', null);

  if (filters.estado) {
    query = query.eq('estado', filters.estado);
  }
  if (filters.locacion) {
    query = query.ilike('locacion', `%${filters.locacion.trim()}%`);
  }
  if (filters.fecha_desde) {
    query = query.gte('fecha_apertura', filters.fecha_desde);
  }
  if (filters.fecha_hasta) {
    query = query.lte('fecha_apertura', filters.fecha_hasta);
  }

  const { data, error, count } = await query
    .order('fecha_apertura', { ascending: true })
    .range(start, end)
    .returns<Expansion[]>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener las expansiones');
  }

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
  };
}

/** Obtiene una expansión por id. Lanza 404 si no existe. */
export async function getExpansionById(id: string): Promise<Expansion> {
  if (!id) {
    throw new ApiError('El identificador de la expansión es requerido', 400);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .eq('deleted_at', null)
    .maybeSingle()
    .returns<Expansion | null>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener la expansión');
  }
  if (!data) {
    throw new ApiError('Expansión no encontrada', 404);
  }

  return data as Expansion;
}

/** Crea una expansión validando los campos requeridos. */
export async function createExpansion(input: CreateExpansionInput): Promise<Expansion> {
  const concesionario = validateRequiredString(input.concesionario, 'concesionario');
  const locacion = validateRequiredString(input.locacion, 'locacion');
  const fechaApertura = validateFecha(input.fecha_apertura, 'fecha_apertura');
  const estado: EstadoExpansion =
    input.estado && isEstadoExpansion(input.estado) ? input.estado : 'proximo';
  const avance = input.avance !== undefined ? validateAvance(input.avance) : 0;

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      concesionario,
      locacion,
      fecha_apertura: fechaApertura,
      estado,
      avance,
      latitud:
        input.latitud !== undefined ? validateCoordenada(input.latitud, 'latitud', -90, 90) : null,
      longitud:
        input.longitud !== undefined
          ? validateCoordenada(input.longitud, 'longitud', -180, 180)
          : null,
      observaciones: input.observaciones ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
    .returns<Expansion>();

  if (error) {
    throw mapSupabaseError(error, 'Error al crear la expansión');
  }

  return data as Expansion;
}

/** Actualiza los datos, el estado o el avance de una expansión. */
export async function updateExpansion(id: string, input: UpdateExpansionInput): Promise<Expansion> {
  if (!id) {
    throw new ApiError('El identificador de la expansión es requerido', 400);
  }

  const updates: Partial<Record<keyof Expansion, unknown>> = {
    updated_at: new Date().toISOString(),
  };

  if (input.concesionario !== undefined) {
    updates.concesionario = validateRequiredString(input.concesionario, 'concesionario');
  }
  if (input.locacion !== undefined) {
    updates.locacion = validateRequiredString(input.locacion, 'locacion');
  }
  if (input.fecha_apertura !== undefined) {
    updates.fecha_apertura = validateFecha(input.fecha_apertura, 'fecha_apertura');
  }
  if (input.estado !== undefined) {
    if (!isEstadoExpansion(input.estado)) {
      throw new ApiError(`Estado inválido. Valores válidos: ${ESTADOS_VALIDOS.join(', ')}`, 400);
    }
    updates.estado = input.estado;
  }
  if (input.avance !== undefined) {
    updates.avance = validateAvance(input.avance);
  }
  if (input.latitud !== undefined) {
    updates.latitud = input.latitud === null ? null : validateCoordenada(input.latitud, 'latitud', -90, 90);
  }
  if (input.longitud !== undefined) {
    updates.longitud =
      input.longitud === null ? null : validateCoordenada(input.longitud, 'longitud', -180, 180);
  }
  if (input.observaciones !== undefined) {
    updates.observaciones = input.observaciones;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .eq('deleted_at', null)
    .select()
    .maybeSingle()
    .returns<Expansion | null>();

  if (error) {
    throw mapSupabaseError(error, 'Error al actualizar la expansión');
  }
  if (!data) {
    throw new ApiError('Expansión no encontrada', 404);
  }

  return data as Expansion;
}

/** Soft delete: marca la expansión con `deleted_at` (no la borra). */
export async function deleteExpansion(id: string): Promise<void> {
  if (!id) {
    throw new ApiError('El identificador de la expansión es requerido', 400);
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error, 'Error al eliminar la expansión');
  }
  if (!data) {
    throw new ApiError('Expansión no encontrada', 404);
  }
}
