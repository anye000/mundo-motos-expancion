/**
 * Rutas del módulo Expansiones.
 *
 * Router de Express montado en /api/v1/expansiones desde src/index.ts.
 */

import { Router } from 'express';
import {
  listExpansiones,
  getExpansion,
  createExpansion,
  updateExpansion,
  deleteExpansion,
} from './expansion.controller';

const expansionesRouter: Router = Router();

expansionesRouter.get('/', listExpansiones);
expansionesRouter.get('/:id', getExpansion);
expansionesRouter.post('/', createExpansion);
expansionesRouter.put('/:id', updateExpansion);
expansionesRouter.delete('/:id', deleteExpansion);

export default expansionesRouter;
