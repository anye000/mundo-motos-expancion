/**
 * Servicio del módulo Concesionarios.
 *
 * Toda la lógica de negocio y acceso a datos sobre la tabla `concesionarios`
 * mediante el cliente de Supabase. Lanza ApiError con códigos de estado
 * HTTP adecuados; los controladores los propagan al error handler global.
 */

import { ApiError } from '@utils/helpers';
import { mapSupabaseError } from '@utils/supabase-errors';
import { getSupabaseConToken } from '@config/supabase';
import {
  Concesionario,
  CreateConcesionarioInput,
  UpdateConcesionarioInput,
  ConcesionarioFilters,
  PaginatedConcesionarios,
  EstadoOperativo,
  HistorialEstado,
  TipoInversion,
  HitoApertura,
} from './concesionario.model';
import { sincronizarExpansion } from '../expansiones/expansion.service';
import { subirImagen } from '../../services/imgbb.service';

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

const TIPOS_INVERSION_VALIDOS = ['Lite-25K', 'Mid-35K', 'Max-50K'] as const;
type TipoInversionServicio = (typeof TIPOS_INVERSION_VALIDOS)[number];

function isTipoInversion(value: unknown): value is TipoInversionServicio {
  return typeof value === 'string' && (TIPOS_INVERSION_VALIDOS as readonly string[]).includes(value);
}

function validateMontoInversion(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const monto = Number(value);
  if (Number.isNaN(monto) || monto < 0) {
    throw new ApiError('El campo "monto_inversion" debe ser un número mayor o igual a 0', 400);
  }
  return monto;
}

function validateHitosApertura(value: unknown): HitoApertura[] | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new ApiError('El campo "hitos_apertura" debe ser un arreglo', 400);
  }
  const hitos: HitoApertura[] = [];
  value.forEach((h, i) => {
    if (!h || typeof h !== 'object') {
      throw new ApiError(`El hito ${i + 1} es inválido`, 400);
    }
    const hit = h as Record<string, unknown>;
    const nombre = typeof hit.hito === 'string' ? hit.hito.trim() : '';
    if (!nombre) {
      throw new ApiError(`El hito ${i + 1} requiere un nombre`, 400);
    }
    hitos.push({ hito: nombre, completado: typeof hit.completado === 'boolean' ? hit.completado : false });
  });
  return hitos;
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
  filters: ConcesionarioFilters = {},
  token: string
): Promise<PaginatedConcesionarios> {
  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const limit =
    filters.limit && filters.limit > 0 ? Math.min(Math.floor(filters.limit), LIMIT_MAX) : 10;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const cliente = getSupabaseConToken(token);
  let query = cliente.from(TABLE).select('*', { count: 'exact' }).is('deleted_at', null);

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
export async function getConcesionarioById(id: string, token: string): Promise<Concesionario> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
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
export async function createConcesionario(input: CreateConcesionarioInput, token: string): Promise<Concesionario> {
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
  const tierInversion: TipoInversion | null =
    input.tier_inversion && isTipoInversion(input.tier_inversion) ? input.tier_inversion : null;
  const montoInversion = validateMontoInversion(input.monto_inversion);
  const hitosApertura = validateHitosApertura(input.hitos_apertura) ?? [];

  const now = new Date().toISOString();
  const cliente = getSupabaseConToken(token);

  const { data, error } = await cliente
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
      tier_inversion: tierInversion,
      monto_inversion: montoInversion,
      hitos_apertura: hitosApertura,
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
  await sincronizarExpansion(creado, token);
  return creado;
}

/** Actualiza los datos o el estado operativo de un concesionario. */
export async function updateConcesionario(
  id: string,
  input: UpdateConcesionarioInput,
  token: string
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
  // El RIF no es modificable tras la creación: se ignora si llega en el payload
  // (la RPC actualizar_concesionario_con_historial lo rechazaría).
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
  if (input.tier_inversion !== undefined) {
    if (!isTipoInversion(input.tier_inversion)) {
      throw new ApiError(`Nivel de inversión inválido. Valores válidos: ${TIPOS_INVERSION_VALIDOS.join(', ')}`, 400);
    }
    updates.tier_inversion = input.tier_inversion;
  }
  if (input.monto_inversion !== undefined) {
    updates.monto_inversion = validateMontoInversion(input.monto_inversion);
  }
  if (input.hitos_apertura !== undefined) {
    updates.hitos_apertura = validateHitosApertura(input.hitos_apertura);
  }

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
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
  await sincronizarExpansion(actualizado, token);
  return actualizado;
}

/** Obtiene el historial de cambios de estado de un concesionario (más reciente primero). */
export async function getHistorialEstados(concesionarioId: string, token: string): Promise<HistorialEstado[]> {
  if (!concesionarioId) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
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
 * Sube (o reemplaza) la imagen de un concesionario a ImgBB y guarda la URL.
 * La imagen anterior queda huérfana en ImgBB (la API no ofrece borrado).
 */
export async function subirImagenConcesionario(
  id: string,
  file: Express.Multer.File,
  token: string
): Promise<Concesionario> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }
  await getConcesionarioById(id, token);

  const image_url = await subirImagen(file);

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from(TABLE)
    .update({ image_url, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
    .returns<Concesionario>();

  if (error) {
    throw mapSupabaseError(error, 'Error al guardar la imagen del concesionario');
  }
  return data as Concesionario;
}

/** Quita la imagen de un concesionario (image_url = null). */
export async function quitarImagenConcesionario(id: string, token: string): Promise<Concesionario> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from(TABLE)
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .maybeSingle()
    .returns<Concesionario | null>();

  if (error) {
    throw mapSupabaseError(error, 'Error al quitar la imagen del concesionario');
  }
  if (!data) {
    throw new ApiError('Concesionario no encontrado', 404);
  }
  return data as Concesionario;
}

/** Elimina físicamente un concesionario. El historial de interacciones CRM y las
 * expansiones vinculadas (cronograma/calendario) se eliminan en cascada
 * (ON DELETE CASCADE en interacciones_crm y expansiones.concesionario_id).
 */
export async function deleteConcesionario(id: string, token: string): Promise<void> {
  if (!id) {
    throw new ApiError('El identificador del concesionario es requerido', 400);
  }

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
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
