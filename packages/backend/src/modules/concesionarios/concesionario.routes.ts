/**
 * Rutas del módulo Concesionarios.
 *
 * Router de Express montado en /api/v1/concesionarios desde src/index.ts.
 */

import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requireAdmin } from '@middleware/requireAdmin';
import {
  listConcesionarios,
  getConcesionario,
  createConcesionario,
  updateConcesionario,
  deleteConcesionario,
  getHistorialEstados,
} from './concesionario.controller';

const concesionariosRouter: Router = Router();

concesionariosRouter.get('/', requireAuth, listConcesionarios);
concesionariosRouter.get('/:id', requireAuth, getConcesionario);
concesionariosRouter.get('/:id/historial-estados', requireAuth, getHistorialEstados);
concesionariosRouter.post('/', requireAdmin, createConcesionario);
concesionariosRouter.put('/:id', requireAdmin, updateConcesionario);
concesionariosRouter.delete('/:id', requireAdmin, deleteConcesionario);

export default concesionariosRouter;
