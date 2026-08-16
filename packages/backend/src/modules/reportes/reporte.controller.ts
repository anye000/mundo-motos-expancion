/**
 * Controlador del módulo Reportes.
 *
 * Capa HTTP: extrae parámetros de la petición, delega en el servicio y
 * responde usando los helpers de @utils/helpers. Los errores se propagan
 * con next() al error handler global de Express.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@utils/helpers';
import * as reporteService from './reporte.service';
import { ReporteFilters } from './reporte.model';
import { EstadoOperativo } from '../concesionarios/concesionario.model';

const ESTADOS_VALIDOS: EstadoOperativo[] = [
  'en_negociacion',
  'proximo',
  'en_ejecucion',
  'activo',
  'inactivo',
  'rechazado',
  'completado',
];

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/** GET /api/v1/reportes - reporte combinado con filtros. */
export async function getReportes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const estado = queryString(req.query.estado);
    const filters: ReporteFilters = {
      concesionario_id: queryString(req.query.concesionario_id),
      estado:
        estado && (ESTADOS_VALIDOS as string[]).includes(estado)
          ? (estado as EstadoOperativo)
          : undefined,
      ciudad: queryString(req.query.ciudad),
      fecha_desde: queryString(req.query.fecha_desde),
      fecha_hasta: queryString(req.query.fecha_hasta),
    };
    const data = await reporteService.getReportes(filters);
    sendSuccess(res, data, 'Reporte generado exitosamente');
  } catch (error) {
    next(error);
  }
}
