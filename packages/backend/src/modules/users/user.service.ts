/**
 * Servicio del módulo Users.
 *
 * Acceso a datos sobre la tabla `users` mediante Supabase. Por ahora solo
 * expone el listado de usuarios activos (para poblar selects del frontend).
 */

import { mapSupabaseError } from '@utils/supabase-errors';
import { getSupabaseConToken } from '@config/supabase';
import { Usuario } from './user.model';

const TABLE = 'users';

export async function getUsuariosActivos(token: string): Promise<Usuario[]> {
  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from(TABLE)
    .select('id, nombre, apellido, email, rol, estado')
    .eq('estado', 'activo')
    .is('deleted_at', null)
    .order('nombre', { ascending: true })
    .returns<Usuario[]>();

  if (error) {
    throw mapSupabaseError(error, 'Error al obtener los usuarios');
  }

  return data ?? [];
}
