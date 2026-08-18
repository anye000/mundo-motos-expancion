/**
 * Rutas de administración de usuarios (RBAC).
 *
 * Estas rutas usan un rate limiter más permisivo (`adminLimiter`)
 * para que el administrador pueda crear múltiples usuarios sin bloqueos.
 * Todas exigen rol de administrador (requireAdmin).
 */

import { Router } from 'express';
import { requireAdmin } from '@middleware/requireAdmin';
import { registrarUsuario, eliminarUsuario, listarUsuarios } from './auth.controller';

const adminRouter: Router = Router();

adminRouter.get('/usuarios', requireAdmin, listarUsuarios);
adminRouter.post('/usuarios', requireAdmin, registrarUsuario);
adminRouter.delete('/usuarios/:id', requireAdmin, eliminarUsuario);

export default adminRouter;
