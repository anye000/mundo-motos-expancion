/**
 * Middleware de autorización: valida el JWT de Supabase del header Authorization
 * y comprueba en `public.profiles` que el usuario tenga rol 'admin'.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '@config/supabase';
import { sendError } from '@utils/helpers';

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      sendError(res, 'No autorizado', 401);
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      sendError(res, 'Sesión inválida o expirada', 401);
      return;
    }

    const { data: perfil } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', data.user.id)
      .maybeSingle();

    if (perfil?.rol !== 'admin') {
      sendError(res, 'Acceso restringido: se requiere rol de administrador', 403);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}