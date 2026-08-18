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
  username: string;
  email_respaldo?: string | null;
}

export interface CrearUsuarioInput {
  username: string;
  password: string;
  nombre?: string;
  emailRespaldo?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: PerfilUsuario;
}