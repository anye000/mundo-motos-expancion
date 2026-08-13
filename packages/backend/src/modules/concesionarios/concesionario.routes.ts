/**
 * Rutas del módulo Concesionarios.
 *
 * Router de Express montado en /api/v1/concesionarios desde src/index.ts.
 */

import { Router } from 'express';
import {
  listConcesionarios,
  getConcesionario,
  createConcesionario,
  updateConcesionario,
} from './concesionario.controller';

const concesionariosRouter: Router = Router();

concesionariosRouter.get('/', listConcesionarios);
concesionariosRouter.get('/:id', getConcesionario);
concesionariosRouter.post('/', createConcesionario);
concesionariosRouter.put('/:id', updateConcesionario);

export default concesionariosRouter;
