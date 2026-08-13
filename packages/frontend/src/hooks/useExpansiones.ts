import { useCallback, useEffect, useState } from 'react'
import { apiService } from '@services/api'
import { CreateExpansionInput, EstadoExpansion, Expansion, ExpansionFilters } from '../types/expansion'

export interface FiltrosExpansiones {
  estado: EstadoExpansion | ''
  locacion: string
}

const FILTROS_INICIALES: FiltrosExpansiones = {
  estado: '',
  locacion: '',
}

export interface UseExpansionesReturn {
  expansiones: Expansion[]
  cargando: boolean
  error: string | null
  filtros: FiltrosExpansiones
  cambiarFiltro: (campo: keyof FiltrosExpansiones, valor: string) => void
  limpiarFiltros: () => void
  recargar: () => void
  crear: (input: CreateExpansionInput) => Promise<Expansion>
  eliminar: (id: string) => Promise<void>
}

function toExpansionFilters(filtros: FiltrosExpansiones): ExpansionFilters {
  return {
    estado: filtros.estado || undefined,
    locacion: filtros.locacion || undefined,
    limit: 200,
  }
}

/**
 * Hook de datos del cronograma de expansión: gestiona la lista de proyecciones
 * y aperturas, los filtros (estado, locación) y la eliminación, consultando
 * la API del backend.
 */
export function useExpansiones(): UseExpansionesReturn {
  const [expansiones, setExpansiones] = useState<Expansion[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosExpansiones>(FILTROS_INICIALES)

  const cargar = useCallback(async (filtrosActivos: FiltrosExpansiones) => {
    setCargando(true)
    setError(null)
    try {
      const resultado = await apiService.getExpansiones(toExpansionFilters(filtrosActivos))
      setExpansiones(resultado.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar las expansiones')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  const cambiarFiltro = useCallback((campo: keyof FiltrosExpansiones, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }, [])

  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_INICIALES), [])

  const recargar = useCallback(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  const crear = useCallback(
    async (input: CreateExpansionInput): Promise<Expansion> => {
      const creada = await apiService.createExpansion(input)
      await cargar(filtros)
      return creada
    },
    [cargar, filtros]
  )

  const eliminar = useCallback(
    async (id: string) => {
      await apiService.deleteExpansion(id)
      await cargar(filtros)
    },
    [cargar, filtros]
  )

  return {
    expansiones,
    cargando,
    error,
    filtros,
    cambiarFiltro,
    limpiarFiltros,
    recargar,
    crear,
    eliminar,
  }
}

export default useExpansiones
