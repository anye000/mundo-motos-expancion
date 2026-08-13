import { useCallback, useEffect, useState } from 'react'
import { apiService } from '@services/api'
import { ReporteData, ReporteFilters } from '../types/reporte'

export interface UseReportesReturn {
  datos: ReporteData | null
  cargando: boolean
  error: string | null
  recargar: () => void
}

/**
 * Hook de datos de la vista de Reportes: consulta GET /api/v1/reportes con
 * los filtros combinados y expone recargar() para refrescarlos.
 */
export function useReportes(filtros: ReporteFilters): UseReportesReturn {
  const [datos, setDatos] = useState<ReporteData | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (activos: ReporteFilters) => {
    setCargando(true)
    setError(null)
    try {
      const resultado = await apiService.getReportes(activos)
      setDatos(resultado)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el reporte')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  const recargar = useCallback(() => {
    void cargar(filtros)
  }, [cargar, filtros])

  return { datos, cargando, error, recargar }
}

export default useReportes
