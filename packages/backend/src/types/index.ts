/**
 * Tipos base para la API Backend
 */

export type UUID = string & { readonly __uuid: unique symbol }

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface PaginationQuery {
  page?: number
  limit?: number
  offset?: number
}

export interface User {
  id: UUID
  email: string
  nombre: string
  apellido: string
  rol: 'admin' | 'gerente' | 'vendedor' | 'operador'
  estado: 'activo' | 'inactivo'
  createdAt: Date
  updatedAt: Date
}

export interface Concesionario {
  id: UUID
  nombre: string
  razonSocial: string
  nit: string
  email: string
  telefono: string
  ciudad: string
  departamento: string
  direccion: string
  latitud: number
  longitud: number
  gerente: UUID
  estado: 'activo' | 'inactivo'
  metadatos?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Ubicacion {
  id: UUID
  concesionarioId: UUID
  nombre: string
  latitud: number
  longitud: number
  direccion: string
  tipo: 'principal' | 'secundaria' | 'almacen'
  estado: 'activo' | 'inactivo'
  createdAt: Date
  updatedAt: Date
}

export interface CRMContact {
  id: UUID
  nombre: string
  email: string
  telefono: string
  empresa: string
  origen: 'llamada' | 'email' | 'web' | 'referencia' | 'otro'
  estado: 'nuevo' | 'en_progreso' | 'calificado' | 'descartado'
  concesionarioId: UUID
  asignadoA: UUID
  metadatos?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface AuthToken {
  userId: UUID
  email: string
  rol: string
}

export type RequestHandler<T = any> = (
  req: Express.Request & { user?: AuthToken },
  res: Express.Response,
  next: Express.NextFunction
) => Promise<void> | void
