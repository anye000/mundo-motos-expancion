/**
 * Rutas del módulo Auth (RBAC).
 *
 * Todas las rutas exigen rol de administrador (requireAdmin), que valida el
 * JWT de Supabase y comprueba el rol en `public.profiles`.
 */

import { Router } from 'express';
import { requireAdmin } from '@middleware/requireAdmin';
import { listarUsuarios, registrarUsuario, eliminarUsuario } from './auth.controller';

const authRouter: Router = Router();

authRouter.get('/usuarios', requireAdmin, listarUsuarios);
authRouter.post('/registrar', requireAdmin, registrarUsuario);
authRouter.delete('/usuarios/:id', requireAdmin, eliminarUsuario);

export default authRouter;