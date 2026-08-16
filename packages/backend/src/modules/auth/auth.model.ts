/**
 * Modelos del módulo Auth (RBAC).
 *
 * El rol de cada usuario se lee de la tabla `public.profiles` de Supabase:
 *   - 'admin'   -> acceso total.
 *   - 'lectura' -> solo lectura.
 */

export type AuthRol = 'admin' | 'lectura';

export interface PerfilUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: AuthRol;
}

export interface CrearUsuarioInput {
  email: string;
  password: string;
  nombre?: string;
}