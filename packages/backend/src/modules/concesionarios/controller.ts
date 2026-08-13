/**
 * Controlador del módulo Concesionarios
 */

import { Router, Request, Response, NextFunction } from 'express'
import { sendSuccess, sendError, ApiError } from '@utils/helpers'
import { Concesionario } from '@types/index'

// Mock data - en producción usar DB
const concesionarios: Concesionario[] = []

/**
 * GET /api/v1/concesionarios
 * Obtener todos los concesionarios
 */
export async function getAllConcesionarios(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = 1, limit = 10 } = req.query
    const startIndex = ((Number(page) - 1) * Number(limit)) as number
    const endIndex = startIndex + Number(limit)
    
    const paginatedData = concesionarios.slice(startIndex, endIndex)
    
    sendPaginated(
      res,
      paginatedData,
      concesionarios.length,
      Number(page),
      Number(limit)
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/concesionarios/:id
 * Obtener concesionario por ID
 */
export async function getConcesionarioById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const concesionario = concesionarios.find((c) => c.id === id)

    if (!concesionario) {
      throw new ApiError('Concesionario no encontrado', 404)
    }

    sendSuccess(res, concesionario)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/v1/concesionarios
 * Crear nuevo concesionario
 */
export async function createConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nombre, razonSocial, nit, email, telefono, ciudad, departamento, direccion, latitud, longitud, gerente } =
      req.body

    if (!nombre || !razonSocial || !nit || !email) {
      throw new ApiError('Campos requeridos faltantes', 400)
    }

    const newConcesionario: Concesionario = {
      id: crypto.randomUUID() as any,
      nombre,
      razonSocial,
      nit,
      email,
      telefono,
      ciudad,
      departamento,
      direccion,
      latitud,
      longitud,
      gerente,
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    concesionarios.push(newConcesionario)
    sendSuccess(res, newConcesionario, 'Concesionario creado exitosamente', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/v1/concesionarios/:id
 * Actualizar concesionario
 */
export async function updateConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const index = concesionarios.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new ApiError('Concesionario no encontrado', 404)
    }

    concesionarios[index] = {
      ...concesionarios[index],
      ...req.body,
      updatedAt: new Date(),
    }

    sendSuccess(res, concesionarios[index], 'Concesionario actualizado')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/v1/concesionarios/:id
 * Eliminar concesionario
 */
export async function deleteConcesionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const index = concesionarios.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new ApiError('Concesionario no encontrado', 404)
    }

    const deleted = concesionarios.splice(index, 1)[0]
    sendSuccess(res, deleted, 'Concesionario eliminado')
  } catch (error) {
    next(error)
  }
}

// Importaciones necesarias
import { sendPaginated } from '@utils/helpers'

// Crear router
export const concesionariosRouter = Router()

concesionariosRouter.get('/', getAllConcesionarios)
concesionariosRouter.get('/:id', getConcesionarioById)
concesionariosRouter.post('/', createConcesionario)
concesionariosRouter.put('/:id', updateConcesionario)
concesionariosRouter.delete('/:id', deleteConcesionario)

export default concesionariosRouter
