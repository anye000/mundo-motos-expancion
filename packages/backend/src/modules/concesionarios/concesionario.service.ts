/**
 * Servicio del módulo Concesionarios.
 *
 * Toda la lógica de negocio y acceso a datos sobre la tabla `concesionarios`
 * mediante el cliente de Supabase. Lanza ApiError con códigos de estado
 * HTTP adecuados; los controladores los propagan al error handler global.
 */

import { ApiError } from '@utils/helpers';
import { mapSupabaseError } from '@utils/supabase-errors';
import { supabase } from '@config/supabase';
import {
  Concesionario,
  CreateConcesionarioInput,
  UpdateConcesionarioInput,
  ConcesionarioFilters,
  PaginatedConcesionarios,
  EstadoOperativo,
} from './concesionario.model';

const TABLE = 'concesionarios';
const ESTADOS_VALIDOS: EstadoOperativo[] = ['activo', 'inactivo'];
const LIMIT_MAX = 100;

function isEstadoOperativo(value: unknown): value is EstadoOperativo {
  return typeof value === 'string' && (ESTADOS_VALIDOS as string[]).includes(value);
}

function validateRequiredString(value: unknown, campo: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(`El campo "${campo}" es requerido`, 400);
  }
  return value.trim();
}

function validateNumber(value: unknown, campo: string, min: number, max: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ApiError(`El campo "${campo}" debe ser un número`, 400);
  }
  if (value < min || value > max) {
    throw new ApiError(`El campo "${campo}" debe estar entre ${min} y ${max}`, 400);
  }
  return value;
}

/**
 * Obtiene los concesionarios con filtros opcionales por estado, ciudad y
 * departamento, con paginación. Excluye registros con soft delete.
 */
export async function getConcesionarios(
  filters: ConcesionarioFilters = {}
): Promise<PaginatedConcesionarios> {
  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const limit =
    filters.limit && filters.limit > 0 ? Math.min(Math.floor(filters.limit), LIMIT_MAX) : 10;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase.from(TABLE).select('*', { count: 'exact' }).is('deleted_at', null);

  if (filters.estado) {
    query = query.eq('estado', filters.estado);
  }
  if (filters.ciudad) {
    query = query.ilike('ciudad', `%${filters.ciudad.trim()}%`);
  }
  if (filters.departamento) {
    query = query.ilike('departamento', `%${filters.departamento.trim()}%`);
  }

  const { data, error, count } = await query
    .order('nombre', { ascending: true })
    .range(start, end)
    .returns<Concesionario[]>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener los concesionarios');
  }

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
  };
}

/** Obtiene un concesionario por id. Lanza 404 si no existe. */
export async function getConcesionarioById(id: string): Promise<Concesionario> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
    .returns<Concesionario | null>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener el concesionario');
  }
  if (!data) {
    throw new ApiError('Concesionario no encontrado', 404);
  }

  return data as Concesionario;
}

/** Crea un concesionario validando los campos requeridos. */
export async function createConcesionario(input: CreateConcesionarioInput): Promise<Concesionario> {
  const nombre = validateRequiredString(input.nombre, 'nombre');
  const razonSocial = validateRequiredString(input.razon_social, 'razon_social');
  const nit = validateRequiredString(input.nit, 'nit');
  const email = validateRequiredString(input.email, 'email');
  const ciudad = validateRequiredString(input.ciudad, 'ciudad');
  const departamento = validateRequiredString(input.departamento, 'departamento');
  const direccion = validateRequiredString(input.direccion, 'direccion');
  const latitud = validateNumber(input.latitud, 'latitud', -90, 90);
  const longitud = validateNumber(input.longitud, 'longitud', -180, 180);
  const estado: EstadoOperativo =
    input.estado && isEstadoOperativo(input.estado) ? input.estado : 'activo';
  const metadatos = input.metadatos ?? {};

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nombre,
      razon_social: razonSocial,
      nit,
      email,
      telefono: input.telefono ?? null,
      ciudad,
      departamento,
      direccion,
      latitud,
      longitud,
      gerente_id: input.gerente_id ?? null,
      estado,
      metadatos,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
    .returns<Concesionario>();

  if (error) {
    throw mapSupabaseError(error, 'Error al crear el concesionario');
  }

  return data as Concesionario;
}

/** Actualiza los datos o el estado operativo de un concesionario. */
export async function updateConcesionario(
  id: string,
  input: UpdateConcesionarioInput
): Promise<Concesionario> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const updates: Partial<Record<keyof Concesionario, unknown>> = {
    updated_at: new Date().toISOString(),
  };

  if (input.nombre !== undefined) {
    updates.nombre = validateRequiredString(input.nombre, 'nombre');
  }
  if (input.razon_social !== undefined) {
    updates.razon_social = validateRequiredString(input.razon_social, 'razon_social');
  }
  if (input.nit !== undefined) {
    updates.nit = validateRequiredString(input.nit, 'nit');
  }
  if (input.email !== undefined) {
    updates.email = validateRequiredString(input.email, 'email');
  }
  if (input.telefono !== undefined) {
    updates.telefono = input.telefono;
  }
  if (input.ciudad !== undefined) {
    updates.ciudad = validateRequiredString(input.ciudad, 'ciudad');
  }
  if (input.departamento !== undefined) {
    updates.departamento = validateRequiredString(input.departamento, 'departamento');
  }
  if (input.direccion !== undefined) {
    updates.direccion = validateRequiredString(input.direccion, 'direccion');
  }
  if (input.latitud !== undefined) {
    updates.latitud = validateNumber(input.latitud, 'latitud', -90, 90);
  }
  if (input.longitud !== undefined) {
    updates.longitud = validateNumber(input.longitud, 'longitud', -180, 180);
  }
  if (input.gerente_id !== undefined) {
    updates.gerente_id = input.gerente_id;
  }
  if (input.estado !== undefined) {
    if (!isEstadoOperativo(input.estado)) {
      throw new ApiError(`Estado inválido. Valores válidos: ${ESTADOS_VALIDOS.join(', ')}`, 400);
    }
    updates.estado = input.estado;
  }
  if (input.metadatos !== undefined) {
    updates.metadatos = input.metadatos;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .maybeSingle()
    .returns<Concesionario | null>();

  if (error) {
    throw mapSupabaseError(error, 'Error al actualizar el concesionario');
  }
  if (!data) {
    throw new ApiError('Concesionario no encontrado', 404);
  }

  return data as Concesionario;
}
