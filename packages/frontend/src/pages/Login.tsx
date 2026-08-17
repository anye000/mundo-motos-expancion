import { FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, LogIn, Lock, User } from 'lucide-react'
import { useAuthStore } from '@store/auth'

interface EstadoUbicacion {
  from?: { pathname?: string }
}

/**
 * Vista de inicio de sesión con Supabase Auth y estética corporativa estricta:
 * fondo negro absoluto, acentos y bordes en amarillo corporativo (#FFCC00),
 * texto blanco y cero azul/cian.
 */
export function Login() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const { login, cargando } = useAuthStore()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!usuario.trim() || !password) {
      setError('Ingresa tu usuario y contraseña')
      return
    }
    try {
      await login(usuario, password)
      toast.success('Sesión iniciada correctamente')
      const destino = (ubicacion.state as EstadoUbicacion | null)?.from?.pathname ?? '/'
      navegar(destino, { replace: true })
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? 'Usuario o contraseña incorrectos'
          : 'No se pudo iniciar sesión'
      setError(mensaje)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo-mundo-motos.svg"
            alt="Mundo Motos"
            className="h-16 w-16 rounded-2xl object-contain"
          />
          <h1 className="text-2xl font-bold text-mm-yellow sm:text-3xl">Mundo Motos</h1>
          <p className="text-sm text-mm-gray-400">
            Sistema de Gestión y Geolocalización de Concesionarios
          </p>
        </div>

        <form
          onSubmit={manejarEnvio}
          className="mt-8 flex flex-col gap-4 rounded-xl border-2 border-mm-yellow bg-black p-6 sm:p-8"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <LogIn className="h-5 w-5 text-mm-yellow" />
            Iniciar sesión
          </h2>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-mm-gray-300">Usuario</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mm-gray-400" />
              <input
                type="text"
                autoComplete="username"
                className="input-dark pl-10"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="tu.usuario"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-mm-gray-300">Contraseña</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mm-gray-400" />
              <input
                type="password"
                autoComplete="current-password"
                className="input-dark pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && (
            <p className="rounded-lg border border-mm-error/40 bg-mm-error/10 px-3 py-2 text-sm text-mm-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="flex items-center justify-center gap-2 rounded-lg bg-mm-yellow px-4 py-2.5 text-sm font-bold text-mm-black transition-colors hover:bg-mm-yellow-dark disabled:opacity-60"
          >
            {cargando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {cargando ? 'Ingresando...' : 'Entrar'}
          </button>

          <p className="text-center text-xs text-mm-gray-500">
            &copy; 2026 Mundo Motos. Acceso restringido al personal autorizado.
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login