import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ApiResponse, PaginatedResponse } from '../types/index'
import {
  Concesionario,
  ConcesionarioFilters,
  CreateConcesionarioInput,
  UpdateConcesionarioInput,
} from '../types/concesionario'
import { InteraccionCrm, CreateInteraccionInput } from '../types/interaccion'
import { Usuario } from '../types/usuario'
import {
  Expansion,
  ExpansionFilters,
  CreateExpansionInput,
  UpdateExpansionInput,
} from '../types/expansion'

class ApiService {
  private client: AxiosInstance

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Interceptor para agregar token de autenticación
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado, limpiar y redirigir
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          (error.response
            ? `Error del servidor (${error.response.status})`
            : 'Error de conexión con el servidor'),
      }
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          (error.response
            ? `Error del servidor (${error.response.status})`
            : 'Error de conexión con el servidor'),
      }
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          (error.response
            ? `Error del servidor (${error.response.status})`
            : 'Error de conexión con el servidor'),
      }
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          (error.response
            ? `Error del servidor (${error.response.status})`
            : 'Error de conexión con el servidor'),
      }
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          (error.response
            ? `Error del servidor (${error.response.status})`
            : 'Error de conexión con el servidor'),
      }
    }
  }

  /**
   * GET /api/v1/concesionarios - lista con filtros de ciudad, departamento y
   * estado operativo. Devuelve la paginación desempaquetada.
   */
  async getConcesionarios(filters: ConcesionarioFilters = {}): Promise<PaginatedResponse<Concesionario>> {
    const response = await this.get<PaginatedResponse<Concesionario>>('/concesionarios', {
      params: filters,
    })
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al obtener los concesionarios')
    }
    return response.data
  }

  /** GET /api/v1/concesionarios/:id - obtiene un concesionario por id. */
  async getConcesionarioById(id: string): Promise<Concesionario> {
    const response = await this.get<Concesionario>(`/concesionarios/${id}`)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Concesionario no encontrado')
    }
    return response.data
  }

  /** POST /api/v1/concesionarios - crea un concesionario. */
  async createConcesionario(input: CreateConcesionarioInput): Promise<Concesionario> {
    const response = await this.post<Concesionario>('/concesionarios', input)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al crear el concesionario')
    }
    return response.data
  }

  /** PUT /api/v1/concesionarios/:id - actualiza datos o estado operativo. */
  async updateConcesionario(id: string, input: UpdateConcesionarioInput): Promise<Concesionario> {
    const response = await this.put<Concesionario>(`/concesionarios/${id}`, input)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al actualizar el concesionario')
    }
    return response.data
  }

  /**
   * GET /api/v1/crm/concesionario/:concesionarioId - historial de
   * interacciones de un concesionario. Devuelve la paginación desempaquetada.
   */
  async getInteracciones(concesionarioId: string): Promise<PaginatedResponse<InteraccionCrm>> {
    const response = await this.get<PaginatedResponse<InteraccionCrm>>(
      `/crm/concesionario/${concesionarioId}`,
      { params: { limit: 100 } }
    )
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al obtener el historial de interacciones')
    }
    return response.data
  }

  /** POST /api/v1/crm - registra una interacción. */
  async createInteraccion(input: CreateInteraccionInput): Promise<InteraccionCrm> {
    const response = await this.post<InteraccionCrm>('/crm', input)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al registrar la interacción')
    }
    return response.data
  }

  /** GET /api/v1/users - lista usuarios activos (para selects de responsables). */
  async getUsuarios(): Promise<Usuario[]> {
    const response = await this.get<Usuario[]>('/users')
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al obtener los usuarios')
    }
    return response.data
  }

  /**
   * GET /api/v1/expansiones - lista de proyecciones/aperturas con filtros por
   * estado, locación y rango de fechas. Devuelve la paginación desempaquetada.
   */
  async getExpansiones(filters: ExpansionFilters = {}): Promise<PaginatedResponse<Expansion>> {
    const response = await this.get<PaginatedResponse<Expansion>>('/expansiones', {
      params: filters,
    })
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al obtener las expansiones')
    }
    return response.data
  }

  /** GET /api/v1/expansiones/:id - obtiene una expansión por id. */
  async getExpansionById(id: string): Promise<Expansion> {
    const response = await this.get<Expansion>(`/expansiones/${id}`)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Expansión no encontrada')
    }
    return response.data
  }

  /** POST /api/v1/expansiones - crea una expansión. */
  async createExpansion(input: CreateExpansionInput): Promise<Expansion> {
    const response = await this.post<Expansion>('/expansiones', input)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al crear la expansión')
    }
    return response.data
  }

  /** PUT /api/v1/expansiones/:id - actualiza datos, estado o avance. */
  async updateExpansion(id: string, input: UpdateExpansionInput): Promise<Expansion> {
    const response = await this.put<Expansion>(`/expansiones/${id}`, input)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al actualizar la expansión')
    }
    return response.data
  }

  /** DELETE /api/v1/expansiones/:id - elimina (soft delete) una expansión. */
  async deleteExpansion(id: string): Promise<void> {
    const response = await this.delete<{ id: string }>(`/expansiones/${id}`)
    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar la expansión')
    }
  }
}

export const apiService = new ApiService()
export default ApiService
