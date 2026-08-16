/**
 * Tipos del módulo de autenticación y control de acceso (RBAC).
 *
 * El rol de cada usuario se lee de la tabla `public.profiles` de Supabase:
 *   - 'admin'   -> acceso total (crear/editar/eliminar, gestionar usuarios).
 *   - 'lectura' -> solo lectura (navegar, ver mapas, historiales y reportes).
 */

export type AuthRol = 'admin' | 'lectura'

export interface PerfilUsuario {
  id: string
  email: string
  nombre: string
  rol: AuthRol
  username: string
  emailRespaldo?: string | null
}

export interface CrearUsuarioInput {
  username: string
  password: string
  nombre: string
  emailRespaldo?: string
}