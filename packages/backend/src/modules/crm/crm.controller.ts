/**
 * Controlador del módulo CRM.
 *
 * Capa HTTP: extrae parámetros de la petición, delega en el servicio y
 * responde usando los helpers de @utils/helpers. Los errores se propagan
 * con next() al error handler global de Express.
 */

import { Request, Response, NextFunction } from 'express';
import { sendPaginated, sendSuccess } from '@utils/helpers';
import * as crmService from './crm.service';
import { InteraccionFilters, TipoInteraccion } from './crm.model';

const TIPOS_VALIDOS: TipoInteraccion[] = ['llamada', 'visita', 'nota_rapida', 'incidencia'];

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function queryNumber(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function extraerToken(req: Request): string {
  return (req as any).token as string;
}

/** GET /api/v1/crm/concesionario/:concesionarioId - historial de interacciones. */
export async function listInteraccionesByConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tipo = queryString(req.query.tipo);
    const filters: InteraccionFilters = {
      tipo:
        tipo && (TIPOS_VALIDOS as string[]).includes(tipo)
          ? (tipo as TipoInteraccion)
          : undefined,
      page: queryNumber(req.query.page),
      limit: queryNumber(req.query.limit),
    };

    const result = await crmService.getInteraccionesByConcesionario(
      req.params.concesionarioId,
      filters,
      extraerToken(req)
    );
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
}

/** POST /api/v1/crm - registra una interacción. */
export async function createInteraccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const interaccion = await crmService.createInteraccion(req.body, extraerToken(req));
    sendSuccess(res, interaccion, 'Interacción registrada exitosamente', 201);
  } catch (error) {
    next(error);
  }
}
