/**
 * Servicio del módulo Auth.
 *
 * Crea usuarios SIN depender de la SERVICE ROLE KEY: usa el RPC
 * `public.crear_usuario_auth` (SECURITY DEFINER, solo admin) que inserta el
 * registro en `auth.users` con `email_confirmed_at` fijado, y el trigger
 * `handle_new_user` crea el perfil. Para listar, usa un cliente autenticado
 * con el token del admin (la policy RLS `profiles_admin_all` permite leerlos).
 */

import bcrypt from 'bcryptjs';
import { getSupabaseConToken } from '@config/supabase';
import { ApiError } from '@utils/helpers';
import { CrearUsuarioInput, PerfilUsuario } from './auth.model';

/** Lista los accesos creados (exclusivo admin). */
export async function listarUsuarios(token: string): Promise<PerfilUsuario[]> {
  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente
    .from('profiles')
    .select('id, email, nombre, rol, username, email_respaldo')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as PerfilUsuario[]) ?? [];
}

/**
 * Crea un acceso de solo lectura a partir de un nombre de usuario único.
 * El email interno se genera como `username@internal.mundomotos.com`.
 * La contraseña se hashea con bcrypt en el backend y el RPC la inserta
 * confirmada para que el acceso funcione de inmediato.
 */
export async function crearUsuario(input: CrearUsuarioInput, token: string): Promise<PerfilUsuario> {
  const nombre = input.nombre?.trim() ?? '';
  const username = input.username.trim().toLowerCase();
  const emailRespaldo = input.emailRespaldo?.trim() || null;

  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    throw new ApiError(
      'El usuario debe tener al menos 3 caracteres (letras, números, punto, guion o guion bajo)',
      400
    );
  }

  const hash = bcrypt.hashSync(input.password, 10);

  const cliente = getSupabaseConToken(token);
  const { data, error } = await cliente.rpc('crear_usuario_auth', {
    p_username: username,
    p_hash: hash,
    p_nombre: nombre,
    p_email_respaldo: emailRespaldo,
  });

  if (error) {
    const msg = error.message || '';
    if (/no_admin/i.test(msg)) {
      throw new ApiError('Acceso restringido: se requiere rol de administrador', 403);
    }
    if (/usuario_existe/i.test(msg)) {
      throw new ApiError('Ya existe un usuario con ese nombre de usuario', 409);
    }
    if (/usuario_invalido|password_invalida/i.test(msg)) {
      throw new ApiError('Datos de usuario inválidos', 400);
    }
    throw new ApiError(msg || 'Error al crear el usuario', 500);
  }

  return {
    id: (data as { id: string }).id,
    email: (data as { email: string }).email,
    nombre,
    username,
    email_respaldo: emailRespaldo,
    rol: 'lectura',
  } as PerfilUsuario;
}

/**
 * Elimina un usuario de acceso de solo lectura.
 * Usa el RPC `eliminar_usuario_auth` (SECURITY DEFINER, solo admin) que borra
 * de auth.users y public.profiles. No requiere SERVICE ROLE KEY.
 */
export async function eliminarUsuario(userId: string, token: string): Promise<void> {
  const cliente = getSupabaseConToken(token);
  const { error } = await cliente.rpc('eliminar_usuario_auth', {
    p_user_id: userId,
  });

  if (error) {
    const msg = error.message || '';
    if (/no_admin/i.test(msg)) {
      throw new ApiError('Acceso restringido: se requiere rol de administrador', 403);
    }
    if (/usuario_no_encontrado/i.test(msg)) {
      throw new ApiError('Usuario no encontrado', 404);
    }
    if (/no_eliminar_admin/i.test(msg)) {
      throw new ApiError('No se puede eliminar un administrador', 403);
    }
    throw new ApiError(msg || 'Error al eliminar el usuario', 500);
  }
}