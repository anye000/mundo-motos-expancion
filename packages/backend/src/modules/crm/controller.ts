/**
 * Controlador del módulo CRM
 * Gestión de contactos, leads y pipeline de ventas
 */

import { Router, Request, Response, NextFunction } from 'express'
import { sendSuccess, sendError, sendPaginated, ApiError } from '@utils/helpers'
import { CRMContact } from '@types/index'

// Mock data
const contacts: CRMContact[] = []

/**
 * GET /api/v1/crm/contacts
 * Obtener todos los contactos
 */
export async function getAllContacts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = 1, limit = 10, estado, concesionarioId, asignadoA } = req.query

    let filtered = contacts
    if (estado) filtered = filtered.filter((c) => c.estado === estado)
    if (concesionarioId) filtered = filtered.filter((c) => c.concesionarioId === concesionarioId)
    if (asignadoA) filtered = filtered.filter((c) => c.asignadoA === asignadoA)

    const startIndex = ((Number(page) - 1) * Number(limit)) as number
    const endIndex = startIndex + Number(limit)
    const paginatedData = filtered.slice(startIndex, endIndex)

    sendPaginated(res, paginatedData, filtered.length, Number(page), Number(limit))
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/crm/contacts/:id
 * Obtener contacto por ID
 */
export async function getContactById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const contact = contacts.find((c) => c.id === id)

    if (!contact) {
      throw new ApiError('Contacto no encontrado', 404)
    }

    sendSuccess(res, contact)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/v1/crm/contacts
 * Crear nuevo contacto
 */
export async function createContact(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nombre, email, telefono, empresa, origen, concesionarioId, asignadoA } = req.body

    if (!nombre || !email || !concesionarioId || !asignadoA) {
      throw new ApiError('Campos requeridos faltantes', 400)
    }

    const newContact: CRMContact = {
      id: crypto.randomUUID() as any,
      nombre,
      email,
      telefono,
      empresa,
      origen: origen || 'otro',
      estado: 'nuevo',
      concesionarioId,
      asignadoA,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    contacts.push(newContact)
    sendSuccess(res, newContact, 'Contacto creado exitosamente', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/v1/crm/contacts/:id
 * Actualizar contacto
 */
export async function updateContact(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const index = contacts.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new ApiError('Contacto no encontrado', 404)
    }

    contacts[index] = {
      ...contacts[index],
      ...req.body,
      updatedAt: new Date(),
    }

    sendSuccess(res, contacts[index], 'Contacto actualizado')
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/v1/crm/contacts/:id/estado
 * Cambiar estado del contacto (pipeline)
 */
export async function updateContactStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const { estado } = req.body

    const estadosValidos = ['nuevo', 'en_progreso', 'calificado', 'descartado']
    if (!estadosValidos.includes(estado)) {
      throw new ApiError(`Estado inválido. Valores válidos: ${estadosValidos.join(', ')}`, 400)
    }

    const index = contacts.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new ApiError('Contacto no encontrado', 404)
    }

    contacts[index].estado = estado as CRMContact['estado']
    contacts[index].updatedAt = new Date()

    sendSuccess(res, contacts[index], `Estado del contacto actualizado a "${estado}"`)
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/v1/crm/contacts/:id
 * Eliminar contacto
 */
export async function deleteContact(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const index = contacts.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new ApiError('Contacto no encontrado', 404)
    }

    const deleted = contacts.splice(index, 1)[0]
    sendSuccess(res, deleted, 'Contacto eliminado')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/crm/analytics
 * Obtener analytics y métricas del CRM
 */
export async function getCRMAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const analytics = {
      totalContactos: contacts.length,
      porEstado: {
        nuevo: contacts.filter((c) => c.estado === 'nuevo').length,
        en_progreso: contacts.filter((c) => c.estado === 'en_progreso').length,
        calificado: contacts.filter((c) => c.estado === 'calificado').length,
        descartado: contacts.filter((c) => c.estado === 'descartado').length,
      },
      porOrigen: {
        llamada: contacts.filter((c) => c.origen === 'llamada').length,
        email: contacts.filter((c) => c.origen === 'email').length,
        web: contacts.filter((c) => c.origen === 'web').length,
        referencia: contacts.filter((c) => c.origen === 'referencia').length,
        otro: contacts.filter((c) => c.origen === 'otro').length,
      },
      tazaConversion: (
        (contacts.filter((c) => c.estado === 'calificado').length / contacts.length) *
        100
      ).toFixed(2),
    }

    sendSuccess(res, analytics)
  } catch (error) {
    next(error)
  }
}

// Router
export const crmRouter = Router()

crmRouter.get('/contacts', getAllContacts)
crmRouter.get('/contacts/:id', getContactById)
crmRouter.post('/contacts', createContact)
crmRouter.put('/contacts/:id', updateContact)
crmRouter.put('/contacts/:id/estado', updateContactStatus)
crmRouter.delete('/contacts/:id', deleteContact)
crmRouter.get('/analytics', getCRMAnalytics)

export default crmRouter
