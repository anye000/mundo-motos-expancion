/**
 * Tipos base para la aplicación
 */

export type UUID = string & { readonly __uuid: unique symbol }

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

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
