import { useCallback, useEffect, useState } from 'react'
import { apiService } from '@services/api'
import { InteraccionCrm } from '../types/interaccion'

export interface UseInteraccionesReturn {
  interacciones: InteraccionCrm[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

/**
 * Hook del historial de interacciones de un concesionario: consulta la lista
 * al montar y expone recargar() para refrescarla tras registrar una nueva.
 */
export function useInteracciones(concesionarioId: string): UseInteraccionesReturn {
  const [interacciones, setInteracciones] = useState<InteraccionCrm[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const resultado = await apiService.getInteracciones(concesionarioId)
      setInteracciones(resultado.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el historial de interacciones')
    } finally {
      setCargando(false)
    }
  }, [concesionarioId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const recargar = useCallback(() => {
    void cargar()
  }, [cargar])

  return { interacciones, cargando, error, recargar }
}

export default useInteracciones
