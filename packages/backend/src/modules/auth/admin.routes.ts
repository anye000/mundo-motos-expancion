/**
 * Rutas de administración de usuarios (RBAC).
 *
 * Estas rutas usan un rate limiter más permisivo (`adminLimiter`)
 * para que el administrador pueda crear múltiples usuarios sin bloqueos.
 * Todas exigen rol de administrador (requireAdmin).
 */

import { Router } from 'express';
import { requireAdmin } from '@middleware/requireAdmin';
import { registrarUsuario } from './auth.controller';

const adminRouter: Router = Router();

adminRouter.post('/usuarios', requireAdmin, registrarUsuario);

export default adminRouter;
