import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Bike, Loader2 } from 'lucide-react'
import { useAuthStore } from '@store/auth'

/**
 * Envuelve rutas privadas: mientras se restaura la sesión muestra un
 * cargador; si no hay sesión autenticada redirige al login conservando la
 * ruta de origen para regresar tras autenticarse.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const ubicacion = useLocation()
  const { usuario, inicializado } = useAuthStore()

  if (!inicializado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
          <Bike className="h-7 w-7" />
        </span>
        <div className="flex items-center gap-2 text-sm text-mm-gray-300">
          <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
          Verificando sesión...
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: ubicacion }} />
  }

  return <>{children}</>
}

export default ProtectedRoute