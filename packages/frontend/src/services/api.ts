import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ApiResponse, PaginatedResponse } from '../types/index'
import {
  Concesionario,
  ConcesionarioFilters,
  CreateConcesionarioInput,
  UpdateConcesionarioInput,
} from '../types/concesionario'

class ApiService {
  private client: AxiosInstance

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api') {
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
        error: error.response?.data?.error || error.message,
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
        error: error.response?.data?.error || error.message,
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
        error: error.response?.data?.error || error.message,
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
        error: error.response?.data?.error || error.message,
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
        error: error.response?.data?.error || error.message,
      }
    }
  }

  /**
   * GET /api/v1/concesionarios - lista con filtros de ciudad, departamento y
   * estado operativo. Devuelve la paginación desempaquetada.
   */
  async getConcesionarios(filters: ConcesionarioFilters = {}): Promise<PaginatedResponse<Concesionario>> {
    const response = await this.get<PaginatedResponse<Concesionario>>('/v1/concesionarios', {
      params: filters,
    })
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al obtener los concesionarios')
    }
    return response.data
  }

  /** GET /api/v1/concesionarios/:id - obtiene un concesionario por id. */
  async getConcesionarioById(id: string): Promise<Concesionario> {
    const response = await this.get<Concesionario>(`/v1/concesionarios/${id}`)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Concesionario no encontrado')
    }
    return response.data
  }

  /** POST /api/v1/concesionarios - crea un concesionario. */
  async createConcesionario(input: CreateConcesionarioInput): Promise<Concesionario> {
    const response = await this.post<Concesionario>('/v1/concesionarios', input)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al crear el concesionario')
    }
    return response.data
  }

  /** PUT /api/v1/concesionarios/:id - actualiza datos o estado operativo. */
  async updateConcesionario(id: string, input: UpdateConcesionarioInput): Promise<Concesionario> {
    const response = await this.put<Concesionario>(`/v1/concesionarios/${id}`, input)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al actualizar el concesionario')
    }
    return response.data
  }
}

export const apiService = new ApiService()
export default ApiService
