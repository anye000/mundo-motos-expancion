/**
 * Rutas del módulo CRM.
 *
 * Router de Express montado en /api/v1/crm desde src/index.ts.
 */

import { Router } from 'express';
import { listInteraccionesByConcesionario, createInteraccion } from './crm.controller';

const crmRouter: Router = Router();

crmRouter.get('/concesionario/:concesionarioId', listInteraccionesByConcesionario);
crmRouter.post('/', createInteraccion);

export default crmRouter;
