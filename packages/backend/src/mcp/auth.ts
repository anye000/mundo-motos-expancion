/**
 * Middleware de autenticación para el transporte MCP.
 *
 * El transporte MCP queda expuesto públicamente (Render, URL pública) y sus
 * herramientas escriben y eliminan registros, por lo que todo acceso exige el
 * secreto compartido MCP_AUTH_TOKEN en el header Authorization:
 *
 *   Authorization: Bearer <MCP_AUTH_TOKEN>
 *
 * Si la variable no está definida en el entorno, el acceso se deniega
 * siempre (fail closed): el endpoint nunca queda abierto por accidente.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '@utils/helpers';

/**
 * Compara dos secretos en tiempo constante (evita ataques de temporización).
 * Se normalizan a hashes SHA-256 para garantizar longitudes iguales antes de
 * timingSafeEqual, que exige buffers del mismo tamaño.
 */
function compararSecretos(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/** Verifica el header Authorization contra MCP_AUTH_TOKEN (falla cerrado). */
export function requerirAuthMcp(req: Request, res: Response, next: NextFunction): void {
  const secreto = process.env.MCP_AUTH_TOKEN;
  if (!secreto) {
    sendError(res, 'Servidor MCP sin token de acceso configurado', 401);
    return;
  }

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || !compararSecretos(token, secreto)) {
    sendError(res, 'No autorizado', 401);
    return;
  }

  next();
}
