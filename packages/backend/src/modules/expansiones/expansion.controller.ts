/**
 * Controlador del módulo Expansiones.
 *
 * Capa HTTP: extrae parámetros de la petición, delega en el servicio y
 * responde usando los helpers de @utils/helpers. Los errores se propagan
 * con next() al error handler global de Express.
 */

import { Request, Response, NextFunction } from 'express';
import { sendPaginated, sendSuccess } from '@utils/helpers';
import * as expansionService from './expansion.service';
import { ExpansionFilters, EstadoExpansion } from './expansion.model';

const ESTADOS_VALIDOS: EstadoExpansion[] = ['proximo', 'en_ejecucion', 'completado'];

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

/** GET /api/v1/expansiones - lista con filtros y paginación. */
export async function listExpansiones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const estado = queryString(req.query.estado);
    const filters: ExpansionFilters = {
      estado:
        estado && (ESTADOS_VALIDOS as string[]).includes(estado)
          ? (estado as EstadoExpansion)
          : undefined,
      locacion: queryString(req.query.locacion),
      fecha_desde: queryString(req.query.fecha_desde),
      fecha_hasta: queryString(req.query.fecha_hasta),
      page: queryNumber(req.query.page),
      limit: queryNumber(req.query.limit),
    };

    const result = await expansionService.getExpansiones(filters, extraerToken(req));
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/expansiones/:id - obtiene una expansión por id. */
export async function getExpansion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const expansion = await expansionService.getExpansionById(req.params.id, extraerToken(req));
    sendSuccess(res, expansion, 'Expansión obtenida');
  } catch (error) {
    next(error);
  }
}

/** POST /api/v1/expansiones - crea una expansión. */
export async function createExpansion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const expansion = await expansionService.createExpansion(req.body, extraerToken(req));
    sendSuccess(res, expansion, 'Expansión creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
}

/** PUT /api/v1/expansiones/:id - actualiza datos, estado o avance. */
export async function updateExpansion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const expansion = await expansionService.updateExpansion(req.params.id, req.body, extraerToken(req));
    sendSuccess(res, expansion, 'Expansión actualizada');
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/v1/expansiones/:id - soft delete. */
export async function deleteExpansion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await expansionService.deleteExpansion(req.params.id, extraerToken(req));
    sendSuccess(res, { id: req.params.id }, 'Expansión eliminada');
  } catch (error) {
    next(error);
  }
}
