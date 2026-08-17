/**
 * Rutas del módulo Users.
 *
 * Router de Express montado en /api/v1/users desde src/index.ts.
 */

import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { listUsuariosActivos } from './user.controller';

const usersRouter: Router = Router();

usersRouter.get('/', requireAuth, listUsuariosActivos);

export default usersRouter;
