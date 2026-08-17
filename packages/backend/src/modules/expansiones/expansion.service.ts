/**
 * Servicio del módulo Expansiones.
 *
 * Toda la lógica de negocio y acceso a datos sobre la tabla `expansiones`
 * mediante el cliente de Supabase. Lanza ApiError con códigos de estado
 * HTTP adecuados; los controladores los propagan al error handler global.
 */

import { ApiError } from '@utils/helpers';
import { mapSupabaseError } from '@utils/supabase-errors';
import { getSupabaseConToken } from '@config/supabase';
import {
  Expansion,
  CreateExpansionInput,
  UpdateExpansionInput,
  ExpansionFilters,
  PaginatedExpansiones,
  EstadoExpansion,
} from './expansion.model';
import type { Concesionario, EstadoOperativo } from '../concesionarios/concesionario.model';

const TABLE = 'expansiones';
const ESTADOS_VALIDOS: EstadoExpansion[] = ['proximo', 'en_ejecucion', 'completado'];
const ESTADOS_EXPANSION: EstadoOperativo[] = ['proximo', 'en_ejecucion', 'completado'];
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

/** Restaura una expansión soft-deleted (reactivación desde el concesionario). */
async function restaurarExpansion(id: string, token: string): Promise<void> {
  const cliente = getSupabaseConToken(token);
  const { error } = await cliente
    .from(TABLE)
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    throw mapSupabaseError(error, 'Error al restaurar la expansión');
  }
}

/** Soft delete directo por id (usado por la sincronización del concesionario). */
async function softDeleteExpansionById(id: string, token: string): Promise<void> {
  const cliente = getSupabaseConToken(token);
  const { error } = await cliente
    .from(TABLE)
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    throw mapSupabaseError(error, 'Error al eliminar la expansión');
  }
}

/**
 * Obtiene la expansión vinculada a un concesionario. Incluye las soft-deleted
 * para poder restaurarlas sin duplicar filas al reactivar el estado.
 */
export async function getExpansionByConcesionarioId(
  concesionarioId: string,
  token: string
): Promise<Expansion | null> {
  if (!concesionarioId) {
    return null;
  }
  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from(TABLE)
    .select('*')
    .eq('concesionario_id', concesionarioId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
    .returns<Expansion | null>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener la expansión del concesionario');
  }
  return data as Expansion | null;
}

/**
 * Resuelve la ubicación de una expansión. Si llegan `ciudad`/`departamento`
 * (formulario nuevo), los valida y deriva `locacion = "Ciudad, Departamento"`
 * (Enfoque A: `locacion` sigue siendo la columna que consume la UI). Si el
 * cliente solo envía `locacion` (legacy), se conserva tal cual.
 */
function resolveUbicacion(input: {
  ciudad?: string;
  departamento?: string;
  locacion?: string;
}): { ciudad: string; departamento: string; locacion: string } {
  if (input.ciudad !== undefined || input.departamento !== undefined) {
    const ciudad = validateRequiredString(input.ciudad, 'ciudad');
    const departamento = validateRequiredString(input.departamento, 'departamento');
    return { ciudad, departamento, locacion: `${ciudad}, ${departamento}` };
  }
  const locacion = validateRequiredString(input.locacion, 'locacion');
  return { ciudad: '', departamento: '', locacion };
}

/** Valida el tipo de apertura si viene; default 'apertura'. */
function validateTipo(value: unknown): string {
  if (value === undefined || value === null) return 'apertura';
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError('El campo "tipo" no puede estar vacío', 400);
  }
  return value.trim();
}

/**
 * Obtiene las expansiones con filtros opcionales por estado, locación y rango
 * de fechas de apertura, con paginación. Excluye registros con soft delete.
 */
export async function getExpansiones(filters: ExpansionFilters = {}, token: string): Promise<PaginatedExpansiones> {
  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const limit =
    filters.limit && filters.limit > 0 ? Math.min(Math.floor(filters.limit), LIMIT_MAX) : 20;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const cliente = getSupabaseConToken(token);
  let query = cliente.from(TABLE).select('*', { count: 'exact' }).is('deleted_at', null);

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
export async function getExpansionById(id: string, token: string): Promise<Expansion> {
  if (!id) {
    throw new ApiError('El identificador de la expansión es requerido', 400);
  }

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
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
export async function createExpansion(input: CreateExpansionInput, token: string): Promise<Expansion> {
  const concesionario = validateRequiredString(input.concesionario, 'concesionario');
  const { ciudad, departamento, locacion } = resolveUbicacion(input);
  const fechaApertura = validateFecha(input.fecha_apertura, 'fecha_apertura');
  const estado: EstadoExpansion =
    input.estado && isEstadoExpansion(input.estado) ? input.estado : 'proximo';
  const tipo = validateTipo(input.tipo);
  const avance = input.avance !== undefined ? validateAvance(input.avance) : 0;

  const now = new Date().toISOString();
  const cliente = getSupabaseConToken(token);

  const { data, error } = await cliente
    .from(TABLE)
    .insert({
      concesionario,
      concesionario_id: input.concesionario_id ?? null,
      locacion,
      fecha_apertura: fechaApertura,
      estado,
      tipo,
      ciudad,
      departamento,
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
export async function updateExpansion(id: string, input: UpdateExpansionInput, token: string): Promise<Expansion> {
  if (!id) {
    throw new ApiError('El identificador de la expansión es requerido', 400);
  }

  const updates: Partial<Record<keyof Expansion, unknown>> = {
    updated_at: new Date().toISOString(),
  };

  if (input.concesionario !== undefined) {
    updates.concesionario = validateRequiredString(input.concesionario, 'concesionario');
  }
  if (input.concesionario_id !== undefined) {
    updates.concesionario_id = input.concesionario_id;
  }
  if (input.ciudad !== undefined || input.departamento !== undefined) {
    const ubicacion = resolveUbicacion(input);
    updates.locacion = ubicacion.locacion;
    updates.ciudad = ubicacion.ciudad;
    updates.departamento = ubicacion.departamento;
  } else if (input.locacion !== undefined) {
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
  if (input.tipo !== undefined) {
    updates.tipo = validateTipo(input.tipo);
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

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
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
export async function deleteExpansion(id: string, token: string): Promise<void> {
  if (!id) {
    throw new ApiError('El identificador de la expansión es requerido', 400);
  }

  const now = new Date().toISOString();
  const cliente = getSupabaseConToken(token);

  const { data, error } = await cliente
    .from(TABLE)
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error, 'Error al eliminar la expansión');
  }
  if (!data) {
    throw new ApiError('Expansión no encontrada', 404);
  }
}

/**
 * Sincroniza la expansión vinculada a un concesionario (formulario maestro).
 *
 * - Estados de expansión (`proximo`, `en_ejecucion`, `completado`) con fecha
 *   de apertura programada: upsertea la expansión vinculada, restaurando una
 *   soft-deleted si existía. Nunca pisa `avance`/`observaciones` (los gestiona
 *   el cronograma).
 * - Estados operativos (`activo`, `inactivo`) o sin fecha: soft deletea la
 *   expansión vinculada si existía.
 */
export async function sincronizarExpansion(concesionario: Concesionario, token: string): Promise<void> {
  const esEstadoExpansion = (ESTADOS_EXPANSION as string[]).includes(concesionario.estado);
  const fechaProgramada = concesionario.fecha_apertura_programada;
  const tieneFecha =
    typeof fechaProgramada === 'string' &&
    fechaProgramada.trim() !== '' &&
    !Number.isNaN(Date.parse(fechaProgramada));

  const existente = await getExpansionByConcesionarioId(concesionario.id, token);

  if (!esEstadoExpansion || !tieneFecha) {
    if (existente && existente.deleted_at === null) {
      await softDeleteExpansionById(existente.id, token);
    }
    return;
  }

  if (existente) {
    if (existente.deleted_at !== null) {
      await restaurarExpansion(existente.id, token);
    }
    await updateExpansion(existente.id, {
      concesionario: concesionario.nombre,
      fecha_apertura: fechaProgramada,
      estado: concesionario.estado as EstadoExpansion,
      tipo: concesionario.tipo_expansion,
      ciudad: concesionario.ciudad,
      departamento: concesionario.departamento,
      latitud: concesionario.latitud,
      longitud: concesionario.longitud,
    }, token);
    return;
  }

  await createExpansion({
    concesionario: concesionario.nombre,
    concesionario_id: concesionario.id,
    fecha_apertura: fechaProgramada,
    estado: concesionario.estado as EstadoExpansion,
    tipo: concesionario.tipo_expansion,
    ciudad: concesionario.ciudad,
    departamento: concesionario.departamento,
    latitud: concesionario.latitud,
    longitud: concesionario.longitud,
    avance: concesionario.estado === 'completado' ? 100 : 0,
  }, token);
}
