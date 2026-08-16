/**
 * Middleware de autorización: valida el JWT de Supabase del header Authorization
 * y comprueba en `public.profiles` que el usuario tenga rol 'admin'.
 *
 * La consulta del perfil se hace con un cliente autenticado con el token del
 * usuario (identidad real), de modo que RLS permita leer su propio perfil sin
 * depender de la SERVICE ROLE KEY.
 */

import { createClient } from '@supabase/supabase-js';
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

    // Cliente autenticado con el token del usuario: RLS evalúa auth.uid() y el
    // usuario puede leer su propio perfil (policy profiles_select_own).
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const cliente = createClient(url ?? '', key ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: perfil } = await cliente
      .from('profiles')
      .select('rol')
      .eq('id', data.user.id)
      .maybeSingle();

    const rol = (perfil?.rol ?? '').toString().trim().toLowerCase();
    if (rol !== 'admin') {
      sendError(res, 'Acceso restringido: se requiere rol de administrador', 403);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}