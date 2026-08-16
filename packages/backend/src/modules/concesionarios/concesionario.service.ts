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
  HistorialEstado,
} from './concesionario.model';
import { sincronizarExpansion } from '../expansiones/expansion.service';

const TABLE = 'concesionarios';
const ESTADOS_VALIDOS: EstadoOperativo[] = [
  'en_negociacion',
  'proximo',
  'en_ejecucion',
  'activo',
  'inactivo',
  'rechazado',
  'completado',
];
const TIPOS_EXPANSION_VALIDOS = ['apertura', 'ampliacion', 'relocalizacion', 'otro'] as const;
type TipoExpansion = (typeof TIPOS_EXPANSION_VALIDOS)[number];
const LIMIT_MAX = 100;

function isEstadoOperativo(value: unknown): value is EstadoOperativo {
  return typeof value === 'string' && (ESTADOS_VALIDOS as string[]).includes(value);
}

function isTipoExpansion(value: unknown): value is TipoExpansion {
  return (
    typeof value === 'string' && (TIPOS_EXPANSION_VALIDOS as readonly string[]).includes(value)
  );
}

function validateRIF(value: unknown, campo: string): string {
  const texto = typeof value === 'string' ? value.trim() : ''
  if (!texto) {
    throw new ApiError(`El campo "${campo}" es requerido`, 400)
  }
  if (!/^[JVG]-?\d{8}-?\d$/.test(texto)) {
    throw new ApiError(`El campo "${campo}" no tiene un formato RIF válido (ej. J-12345678-9)`, 400)
  }
  return texto
}

function validateFechaOpcional(value: unknown, campo: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new ApiError(`El campo "${campo}" debe ser una fecha válida (YYYY-MM-DD)`, 400);
  }
  return value.trim();
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
  const rif = validateRIF(input.rif, 'rif');
  const email = validateRequiredString(input.email, 'email');
  const ciudad = validateRequiredString(input.ciudad, 'ciudad');
  const departamento = validateRequiredString(input.departamento, 'departamento');
  const direccion = validateRequiredString(input.direccion, 'direccion');
  const latitud = validateNumber(input.latitud, 'latitud', -90, 90);
  const longitud = validateNumber(input.longitud, 'longitud', -180, 180);
  const estado: EstadoOperativo =
    input.estado && isEstadoOperativo(input.estado) ? input.estado : 'activo';
  const fechaAperturaProgramada = validateFechaOpcional(
    input.fecha_apertura_programada,
    'fecha_apertura_programada'
  );
  const tipoExpansion: TipoExpansion =
    input.tipo_expansion && isTipoExpansion(input.tipo_expansion)
      ? input.tipo_expansion
      : 'apertura';
  const metadatos = input.metadatos ?? {};

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nombre,
      razon_social: razonSocial,
      rif,
      email,
      telefono: input.telefono ?? null,
      ciudad,
      departamento,
      direccion,
      latitud,
      longitud,
      gerente_id: input.gerente_id ?? null,
      estado,
      fecha_apertura_programada: fechaAperturaProgramada,
      tipo_expansion: tipoExpansion,
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

  const creado = data as Concesionario;
  await sincronizarExpansion(creado);
  return creado;
}

/** Actualiza los datos o el estado operativo de un concesionario. */
export async function updateConcesionario(
  id: string,
  input: UpdateConcesionarioInput
): Promise<Concesionario> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const updates: Partial<Record<keyof Concesionario, unknown>> = {};

  if (input.nombre !== undefined) {
    updates.nombre = validateRequiredString(input.nombre, 'nombre');
  }
  if (input.razon_social !== undefined) {
    updates.razon_social = validateRequiredString(input.razon_social, 'razon_social');
  }
  if (input.rif !== undefined) {
    updates.rif = validateRIF(input.rif, 'rif');
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
  if (input.fecha_apertura_programada !== undefined) {
    updates.fecha_apertura_programada = validateFechaOpcional(
      input.fecha_apertura_programada,
      'fecha_apertura_programada'
    );
  }
  if (input.tipo_expansion !== undefined) {
    if (!isTipoExpansion(input.tipo_expansion)) {
      throw new ApiError(
        `Tipo de expansión inválido. Valores válidos: ${TIPOS_EXPANSION_VALIDOS.join(', ')}`,
        400
      );
    }
    updates.tipo_expansion = input.tipo_expansion;
  }
  if (input.metadatos !== undefined) {
    updates.metadatos = input.metadatos;
  }

  const { data, error } = await supabase
    .rpc('actualizar_concesionario_con_historial', {
      p_id: id,
      p_updates: updates,
    })
    .single()
    .returns<Concesionario | null>();

  if (error) {
    if (error.code === 'P0002') {
      throw new ApiError('Concesionario no encontrado', 404);
    }
    throw mapSupabaseError(error, 'Error al actualizar el concesionario');
  }
  if (!data) {
    throw new ApiError('Concesionario no encontrado', 404);
  }

  const actualizado = data as Concesionario;
  await sincronizarExpansion(actualizado);
  return actualizado;
}

/** Obtiene el historial de cambios de estado de un concesionario (más reciente primero). */
export async function getHistorialEstados(concesionarioId: string): Promise<HistorialEstado[]> {
  if (!concesionarioId) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const { data, error } = await supabase
    .from('historial_estados')
    .select('*')
    .eq('concesionario_id', concesionarioId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .returns<HistorialEstado[]>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener el historial de estados');
  }

  return data ?? [];
}

/**
 * Elimina físicamente un concesionario. El historial de interacciones CRM y las
 * expansiones vinculadas (cronograma/calendario) se eliminan en cascada
 * (ON DELETE CASCADE en interacciones_crm y expansiones.concesionario_id).
 */
export async function deleteConcesionario(id: string): Promise<void> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error, 'Error al eliminar el concesionario');
  }
  if (!data) {
    throw new ApiError('Concesionario no encontrado', 404);
  }
}
