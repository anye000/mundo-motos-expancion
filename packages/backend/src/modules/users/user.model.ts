/**
 * Modelos del módulo Users.
 *
 * Subconjunto de la tabla `users` expuesto por la API (sin password_hash).
 * Alineado con docs/base-de-datos.md.
 */

export type UserRol = 'admin' | 'gerente' | 'vendedor' | 'operador';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRol;
  estado: 'activo' | 'inactivo';
}
