/**
 * Controlador del módulo Auth.
 *
 * Capa HTTP: valida la entrada, delega en el servicio y responde con los
 * helpers de @utils/helpers. Los errores se propagan al handler global.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, ApiError } from '@utils/helpers';
import * as authService from './auth.service';

/** GET /api/v1/auth/usuarios - lista los accesos creados (admin). */
export async function listarUsuarios(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extraerToken(req);
    const usuarios = await authService.listarUsuarios(token);
    sendSuccess(res, usuarios, 'Usuarios obtenidos');
  } catch (error) {
    next(error);
  }
}

/** POST /api/v1/auth/registrar - crea un acceso de solo lectura (admin). */
export async function registrarUsuario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, password, nombre, emailRespaldo } = req.body ?? {};
    if (!username || !password) {
      throw new ApiError('El usuario y la contraseña temporal son obligatorios', 400);
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw new ApiError('La contraseña debe tener al menos 6 caracteres', 400);
    }
    const token = extraerToken(req);
    const usuario = await authService.crearUsuario(
      { username, password, nombre, emailRespaldo },
      token
    );
    sendSuccess(res, usuario, 'Usuario creado', 201);
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/v1/auth/usuarios/:id - elimina un acceso de solo lectura (admin). */
export async function eliminarUsuario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('ID de usuario requerido', 400);
    const token = extraerToken(req);
    await authService.eliminarUsuario(id, token);
    sendSuccess(res, null, 'Usuario eliminado');
  } catch (error) {
    next(error);
  }
}

/** Extrae el Bearer token del header Authorization. */
function extraerToken(req: Request): string {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    throw new ApiError('No autorizado', 401);
  }
  return token;
}