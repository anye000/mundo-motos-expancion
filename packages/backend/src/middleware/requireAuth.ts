/**
 * Middleware de autenticación: valida el JWT de Supabase del header Authorization
 * y asegura que el usuario tenga un perfil válido en `public.profiles`.
 *
 * No verifica el rol; solo confirma identidad. Usa `requireAdmin` para rutas
 * que requieran privilegios administrativos.
 */

import { Request, Response, NextFunction } from 'express';
import { getSupabaseConToken } from '@config/supabase';
import { sendError, esJwtValido } from '@utils/helpers';

export async function requireAuth(
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

    const cliente = getSupabaseConToken(token);

    const { data: { user }, error: userError } = await cliente.auth.getUser(token);
    if (userError || !user) {
      sendError(res, 'Sesión inválida o expirada', 401);
      return;
    }

    const { data: perfil } = await cliente
      .from('profiles')
      .select('id, rol, estado')
      .eq('id', user.id)
      .maybeSingle();

    if (!perfil) {
      sendError(res, 'Acceso restringido: perfil no encontrado', 403);
      return;
    }

    (req as any).user = user;
    (req as any).token = token;
    next();
  } catch (error) {
    next(error);
  }
}
