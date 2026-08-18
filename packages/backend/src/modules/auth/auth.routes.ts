/**
 * Rutas del módulo Auth (RBAC).
 *
 * - POST /login → público (no requiere auth).
 * - GET /usuarios, POST /registrar, DELETE /usuarios/:id → requieren admin.
 */

import { Router } from 'express';
import { requireAdmin } from '@middleware/requireAdmin';
import { login, listarUsuarios, registrarUsuario, eliminarUsuario } from './auth.controller';

const authRouter: Router = Router();

authRouter.post('/login', login);
authRouter.get('/usuarios', requireAdmin, listarUsuarios);
authRouter.post('/registrar', requireAdmin, registrarUsuario);
authRouter.delete('/usuarios/:id', requireAdmin, eliminarUsuario);

export default authRouter;