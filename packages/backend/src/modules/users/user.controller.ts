/**
 * Controlador del módulo Users.
 *
 * Capa HTTP: delega en el servicio y responde usando los helpers de
 * @utils/helpers. Los errores se propagan con next() al error handler global.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@utils/helpers';
import * as userService from './user.service';

function extraerToken(req: Request): string {
  return (req as any).token as string;
}

/** GET /api/v1/users - lista usuarios activos. */
export async function listUsuariosActivos(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usuarios = await userService.getUsuariosActivos(extraerToken(req));
    sendSuccess(res, usuarios, 'Usuarios obtenidos');
  } catch (error) {
    next(error);
  }
}
