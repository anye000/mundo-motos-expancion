/**
 * Rutas del módulo Reportes.
 *
 * Router de Express montado en /api/v1/reportes desde src/index.ts.
 */

import { Router } from 'express';
import { getReportes } from './reporte.controller';

const reportesRouter: Router = Router();

reportesRouter.get('/', getReportes);

export default reportesRouter;
