/**
 * Controlador del módulo Concesionarios.
 *
 * Capa HTTP: extrae parámetros de la petición, delega en el servicio y
 * responde usando los helpers de @utils/helpers. Los errores se propagan
 * con next() al error handler global de Express.
 */

import { Request, Response, NextFunction } from 'express';
import { sendPaginated, sendSuccess } from '@utils/helpers';
import * as concesionarioService from './concesionario.service';
import { ConcesionarioFilters, EstadoOperativo } from './concesionario.model';

const ESTADOS_VALIDOS: EstadoOperativo[] = [
  'activo',
  'inactivo',
  'proximo',
  'en_ejecucion',
  'completado',
];

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

/** GET /api/v1/concesionarios - lista con filtros y paginación. */
export async function listConcesionarios(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const estado = queryString(req.query.estado);
    const filters: ConcesionarioFilters = {
      estado:
        estado && (ESTADOS_VALIDOS as string[]).includes(estado)
          ? (estado as EstadoOperativo)
          : undefined,
      ciudad: queryString(req.query.ciudad),
      departamento: queryString(req.query.departamento),
      page: queryNumber(req.query.page),
      limit: queryNumber(req.query.limit),
    };

    const result = await concesionarioService.getConcesionarios(filters);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/concesionarios/:id - obtiene un concesionario por id. */
export async function getConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const concesionario = await concesionarioService.getConcesionarioById(req.params.id);
    sendSuccess(res, concesionario, 'Concesionario obtenido');
  } catch (error) {
    next(error);
  }
}

/** POST /api/v1/concesionarios - crea un concesionario. */
export async function createConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const concesionario = await concesionarioService.createConcesionario(req.body);
    sendSuccess(res, concesionario, 'Concesionario creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
}

/** PUT /api/v1/concesionarios/:id - actualiza datos o estado operativo. */
export async function updateConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const concesionario = await concesionarioService.updateConcesionario(req.params.id, req.body);
    sendSuccess(res, concesionario, 'Concesionario actualizado');
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/v1/concesionarios/:id - elimina un concesionario. */
export async function deleteConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await concesionarioService.deleteConcesionario(req.params.id);
    sendSuccess(res, { id: req.params.id }, 'Concesionario eliminado');
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/concesionarios/:id/historial-estados - historial de cambios de estado. */
export async function getHistorialEstados(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const historial = await concesionarioService.getHistorialEstados(req.params.id);
    sendSuccess(res, historial, 'Historial de estados obtenido');
  } catch (error) {
    next(error);
  }
}
