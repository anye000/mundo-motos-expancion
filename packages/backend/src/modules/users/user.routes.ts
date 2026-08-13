/**
 * Rutas del módulo Users.
 *
 * Router de Express montado en /api/v1/users desde src/index.ts.
 */

import { Router } from 'express';
import { listUsuariosActivos } from './user.controller';

const usersRouter: Router = Router();

usersRouter.get('/', listUsuariosActivos);

export default usersRouter;
