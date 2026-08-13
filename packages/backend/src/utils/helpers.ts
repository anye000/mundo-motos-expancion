/**
 * Utilidades comunes del backend
 */

import { Response } from 'express'
import { ApiResponse, PaginatedResponse } from '../types/index'

/**
 * Respuesta exitosa de API
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Operación exitosa',
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  } as ApiResponse<T>)
}

/**
 * Respuesta paginada de API
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode: number = 200
): Response {
  const hasMore = page * limit < total
  return res.status(statusCode).json({
    success: true,
    data: {
      data,
      total,
      page,
      limit,
      hasMore,
    } as PaginatedResponse<T>,
  })
}

/**
 * Respuesta de error de API
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400,
  code?: string
): Response {
  return res.status(statusCode).json({
    success: false,
    error,
    code,
  } as ApiResponse)
}

/**
 * Generar UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Validar UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Extraer y validar token JWT del header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

/**
 * Crear un error con status
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Validar que un objeto tenga todas las propiedades requeridas
 */
export function validateRequired<T extends Record<string, any>>(
  obj: T,
  required: (keyof T)[]
): boolean {
  return required.every((key) => obj[key] !== undefined && obj[key] !== null)
}

/**
 * Sanitizar entrada para prevenir SQL injection (uso recomendado: usar ORM/Prepared Statements)
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/['"]/g, '')
}

/**
 * Paginar array
 */
export function paginate<T>(
  array: T[],
  page: number = 1,
  limit: number = 10
): { data: T[]; total: number; page: number; limit: number } {
  const total = array.length
  const start = (page - 1) * limit
  const end = start + limit
  return {
    data: array.slice(start, end),
    total,
    page,
    limit,
  }
}
