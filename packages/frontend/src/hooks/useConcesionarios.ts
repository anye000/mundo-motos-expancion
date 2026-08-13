import { useCallback, useEffect, useState } from 'react'
import { apiService } from '@services/api'
import { Concesionario, ConcesionarioFilters, EstadoOperativo } from '../types/concesionario'

export interface FiltrosConcesionarios {
  ciudad: string
  departamento: string
  estado: EstadoOperativo | ''
}

const FILTROS_INICIALES: FiltrosConcesionarios = {
  ciudad: '',
  departamento: '',
  estado: '',
}

export interface UseConcesionariosReturn {
  concesionarios: Concesionario[]
  cargando: boolean
  error: string | null
  filtros: FiltrosConcesionarios
  cambiarFiltro: (campo: keyof FiltrosConcesionarios, valor: string) => void
  limpiarFiltros: () => void
  ciudades: string[]
  departamentos: string[]
  recargar: () => void
}

function toConcesionarioFilters(filtros: FiltrosConcesionarios): ConcesionarioFilters {
  return {
    ciudad: filtros.ciudad || undefined,
    departamento: filtros.departamento || undefined,
    estado: filtros.estado || undefined,
    limit: 100,
  }
}

/**
 * Hook de datos del dashboard de concesionarios: gestiona la lista, los
 * filtros (ciudad, departamento, estado operativo) y las opciones de los
 * selectores, consultando la API del backend.
 */
export function useConcesionarios(): UseConcesionariosReturn {
  const [concesionarios, setConcesionarios] = useState<Concesionario[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosConcesionarios>(FILTROS_INICIALES)
  const [ciudades, setCiudades] = useState<string[]>([])
  const [departamentos, setDepartamentos] = useState<string[]>([])

  const cargar = useCallback(async (filtrosActivos: FiltrosConcesionarios) => {
    setCargando(true)
    setError(null)
    try {
      const resultado = await apiService.getConcesionarios(toConcesionarioFilters(filtrosActivos))
      setConcesionarios(resultado.data)
      if (!filtrosActivos.ciudad && !filtrosActivos.departamento && !filtrosActivos.estado) {
        setCiudades(Array.from(new Set(resultado.data.map((c) => c.ciudad))).sort())
        setDepartamentos(Array.from(new Set(resultado.data.map((c) => c.departamento))).sort())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los concesionarios')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  const cambiarFiltro = useCallback((campo: keyof FiltrosConcesionarios, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }, [])

  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_INICIALES), [])

  const recargar = useCallback(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  return {
    concesionarios,
    cargando,
    error,
    filtros,
    cambiarFiltro,
    limpiarFiltros,
    ciudades,
    departamentos,
    recargar,
  }
}

export default useConcesionarios
