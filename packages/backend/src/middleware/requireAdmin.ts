/**
 * Middleware de autorización: valida el JWT de Supabase del header Authorization
 * y comprueba en `public.profiles` que el usuario tenga rol 'admin'.
 *
 * Usa el cliente autenticado con el token del usuario para que RLS permita
 * leer su propio perfil (policy profiles_select_own) sin SERVICE_ROLE_KEY.
 */

import { Request, Response, NextFunction } from 'express';
import { getSupabaseConToken } from '@config/supabase';
import { sendError, esJwtValido } from '@utils/helpers';

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token || !esJwtValido(token)) {
      sendError(res, 'No autorizado', 401);
      return;
    }

    // Cliente autenticado con el token del usuario: valida el JWT y permite RLS
    const cliente = getSupabaseConToken(token);

    // Verificar que el token es válido obteniendo el usuario
    const { data: { user }, error: userError } = await cliente.auth.getUser();
    if (userError || !user) {
      sendError(res, 'Sesión inválida o expirada', 401);
      return;
    }

    // Leer perfil del usuario autenticado (RLS permite leer propio perfil)
    const { data: perfil } = await cliente
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle();

    const rol = (perfil?.rol ?? '').toString().trim().toLowerCase();
    if (rol !== 'admin') {
      sendError(res, 'Acceso restringido: se requiere rol de administrador', 403);
      return;
    }

    // Adjuntar user al request para uso posterior
    (req as any).user = user;
    next();
  } catch (error) {
    next(error);
  }
}