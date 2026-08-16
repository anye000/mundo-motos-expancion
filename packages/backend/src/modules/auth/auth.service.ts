/**
 * Servicio del módulo Auth.
 *
 * Usa el cliente con rol de servicio (service role) para crear usuarios de
 * Supabase Auth y leer/gestionar sus perfiles (rol) en `public.profiles`.
 */

import { supabase } from '@config/supabase';
import { getSupabaseAdmin } from '@config/supabaseAdmin';
import { ApiError } from '@utils/helpers';
import { CrearUsuarioInput, PerfilUsuario } from './auth.model';

/** Lee el perfil de un usuario desde `public.profiles` (cliente anónimo). */
async function obtenerPerfil(userId: string): Promise<PerfilUsuario | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, nombre, rol, username, email_respaldo')
    .eq('id', userId)
    .maybeSingle();
  return (data as PerfilUsuario) ?? null;
}

/** Lista los accesos creados (exclusivo admin). */
export async function listarUsuarios(): Promise<PerfilUsuario[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, nombre, rol, username, email_respaldo')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as PerfilUsuario[]) ?? [];
}

/**
 * Crea un acceso de solo lectura a partir de un nombre de usuario único.
 * El email interno se genera automáticamente como `username@mundomotos.internal`
 * (Supabase Auth sigue usando email por debajo).
 */
export async function crearUsuario(input: CrearUsuarioInput): Promise<PerfilUsuario> {
  const admin = getSupabaseAdmin();
  const nombre = input.nombre?.trim() ?? '';
  const username = input.username.trim().toLowerCase();
  const emailRespaldo = input.emailRespaldo?.trim() || null;

  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    throw new ApiError('El usuario debe tener al menos 3 caracteres (letras, números, punto, guion o guion bajo)', 400);
  }

  // Verifica unicidad del username (la unicidad del email la impone Auth).
  const { data: existente } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existente) {
    throw new ApiError('Ya existe un usuario con ese nombre de usuario', 409);
  }

  const email = `${username}@mundomotos.internal`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { rol: 'lectura', nombre, username, email_respaldo: emailRespaldo },
  });

  if (error) {
    if (error.status === 422 || /already|exists|en uso/i.test(error.message || '')) {
      throw new ApiError('Ya existe un usuario con ese nombre de usuario', 409);
    }
    throw new ApiError(error.message || 'Error al crear el usuario', 500);
  }
  if (!data.user) {
    throw new ApiError('No se pudo crear el usuario', 500);
  }

  // Normalmente el trigger handle_new_user crea el perfil. Si no ocurrió
  // (p. ej. flujo inusual), lo inserta explícitamente.
  const perfil = await obtenerPerfil(data.user.id);
  if (perfil) return perfil;

  const { data: insertado, error: errInsert } = await admin
    .from('profiles')
    .insert({
      id: data.user.id,
      email: data.user.email,
      nombre,
      username,
      email_respaldo: emailRespaldo,
      rol: 'lectura',
    })
    .select('id, email, nombre, rol, username, email_respaldo')
    .single();

  if (errInsert) {
    throw new ApiError(`Perfil no creado: ${errInsert.message}`, 500);
  }
  return insertado as PerfilUsuario;
}