/**
 * Tipos del módulo Users.
 *
 * Subconjunto de la tabla `users` expuesto por GET /api/v1/users.
 */

export type UserRol = 'admin' | 'gerente' | 'vendedor' | 'operador'

export interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: UserRol
  estado: 'activo' | 'inactivo'
}
