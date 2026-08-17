/**
 * Rutas del módulo CRM.
 *
 * Router de Express montado en /api/v1/crm desde src/index.ts.
 */

import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requireAdmin } from '@middleware/requireAdmin';
import { listInteraccionesByConcesionario, createInteraccion } from './crm.controller';

const crmRouter: Router = Router();

crmRouter.get('/concesionario/:concesionarioId', requireAuth, listInteraccionesByConcesionario);
crmRouter.post('/', requireAdmin, createInteraccion);

export default crmRouter;
