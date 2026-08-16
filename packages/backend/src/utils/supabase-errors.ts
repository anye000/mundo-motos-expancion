/**
 * Utilidades para mapear errores de Supabase/Postgres a ApiError con status HTTP.
 *
 * Códigos de error de Postgres manejados:
 * - 23505: violación de unicidad (ej. RIF duplicado)
 * - 23503: violación de llave foránea
 * - 22P02: conversión inválida (ej. UUID mal formado)
 */

import { ApiError } from './helpers';

export function mapSupabaseError(error: { message?: string; code?: string }, contexto: string): ApiError {
  if (error.code === '23505') {
    return new ApiError(
      `${contexto}: ya existe un registro con el mismo valor único`,
      409,
      error.code
    );
  }
  if (error.code === '23503') {
    return new ApiError(`${contexto}: el registro referenciado no existe`, 400, error.code);
  }
  if (error.code === '22P02') {
    return new ApiError(`${contexto}: identificador inválido`, 400, error.code);
  }
  return new ApiError(
    `${contexto}: ${error.message || 'error desconocido de base de datos'}`,
    500,
    error.code
  );
}
