/**
 * Controlador del módulo Ubicaciones (Geolocalización)
 */

import { Router, Request, Response, NextFunction } from 'express'
import { sendSuccess, sendPaginated, ApiError } from '@utils/helpers'
import { Ubicacion } from '../../types/index'

// Mock data
const ubicaciones: Ubicacion[] = []

/**
 * GET /api/v1/ubicaciones
 * Obtener todas las ubicaciones
 */
export async function getAllUbicaciones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = 1, limit = 10, concesionarioId } = req.query
    
    let filtered = ubicaciones
    if (concesionarioId) {
      filtered = ubicaciones.filter((u) => u.concesionarioId === concesionarioId)
    }

    const startIndex = ((Number(page) - 1) * Number(limit)) as number
    const endIndex = startIndex + Number(limit)
    const paginatedData = filtered.slice(startIndex, endIndex)

    sendPaginated(res, paginatedData, filtered.length, Number(page), Number(limit))
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/ubicaciones/:id
 * Obtener ubicación por ID
 */
export async function getUbicacionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const ubicacion = ubicaciones.find((u) => u.id === id)

    if (!ubicacion) {
      throw new ApiError('Ubicación no encontrada', 404)
    }

    sendSuccess(res, ubicacion)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/ubicaciones/geo/cercanas
 * Obtener ubicaciones cercanas (dentro de radio en km)
 */
export async function getUbicacionesCercanas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { latitud, longitud, radio = 10 } = req.query

    if (!latitud || !longitud) {
      throw new ApiError('Latitud y longitud requeridas', 400)
    }

    const lat = Number(latitud)
    const lon = Number(longitud)
    const radiusKm = Number(radio)

    // Fórmula Haversine para calcular distancia
    const cercanas = ubicaciones.filter((u) => {
      const R = 6371 // Radio de la tierra en km
      const dLat = ((u.latitud - lat) * Math.PI) / 180
      const dLon = ((u.longitud - lon) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((u.latitud * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distancia = R * c

      return distancia <= radiusKm
    })

    sendSuccess(res, cercanas)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/v1/ubicaciones
 * Crear nueva ubicación
 */
export async function createUbicacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { concesionarioId, nombre, latitud, longitud, direccion, tipo } = req.body

    if (!concesionarioId || !nombre || !latitud || !longitud) {
      throw new ApiError('Campos requeridos faltantes', 400)
    }

    const newUbicacion: Ubicacion = {
      id: crypto.randomUUID() as any,
      concesionarioId,
      nombre,
      latitud,
      longitud,
      direccion,
      tipo: tipo || 'principal',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ubicaciones.push(newUbicacion)
    sendSuccess(res, newUbicacion, 'Ubicación creada exitosamente', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/v1/ubicaciones/:id
 * Actualizar ubicación
 */
export async function updateUbicacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const index = ubicaciones.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new ApiError('Ubicación no encontrada', 404)
    }

    ubicaciones[index] = {
      ...ubicaciones[index],
      ...req.body,
      updatedAt: new Date(),
    }

    sendSuccess(res, ubicaciones[index], 'Ubicación actualizada')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/v1/ubicaciones/:id
 * Eliminar ubicación
 */
export async function deleteUbicacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const index = ubicaciones.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new ApiError('Ubicación no encontrada', 404)
    }

    const deleted = ubicaciones.splice(index, 1)[0]
    sendSuccess(res, deleted, 'Ubicación eliminada')
  } catch (error) {
    next(error)
  }
}

// Router
export const ubicacionesRouter = Router()

ubicacionesRouter.get('/', getAllUbicaciones)
ubicacionesRouter.get('/geo/cercanas', getUbicacionesCercanas)
ubicacionesRouter.get('/:id', getUbicacionById)
ubicacionesRouter.post('/', createUbicacion)
ubicacionesRouter.put('/:id', updateUbicacion)
ubicacionesRouter.delete('/:id', deleteUbicacion)

export default ubicacionesRouter
