/**
 * Rutas del módulo Expansiones.
 *
 * Router de Express montado en /api/v1/expansiones desde src/index.ts.
 */

import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requireAdmin } from '@middleware/requireAdmin';
import {
  listExpansiones,
  getExpansion,
  createExpansion,
  updateExpansion,
  deleteExpansion,
} from './expansion.controller';

const expansionesRouter: Router = Router();

expansionesRouter.get('/', requireAuth, listExpansiones);
expansionesRouter.get('/:id', requireAuth, getExpansion);
expansionesRouter.post('/', requireAdmin, createExpansion);
expansionesRouter.put('/:id', requireAdmin, updateExpansion);
expansionesRouter.delete('/:id', requireAdmin, deleteExpansion);

export default expansionesRouter;
