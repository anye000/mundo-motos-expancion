import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, RefreshCw, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react'
import { apiService } from '@services/api'
import { PerfilUsuario } from '../types/auth'

export interface GestionUsuariosModalProps {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Panel de gestión de accesos (exclusivo del administrador): lista los
 * usuarios creados y permite crear nuevos accesos de solo lectura con correo
 * y contraseña temporal.
 */
export function GestionUsuariosModal({ abierto, onCerrar }: GestionUsuariosModalProps) {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [emailRespaldo, setEmailRespaldo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<PerfilUsuario | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const lista = await apiService.getAuthUsuarios()
      setUsuarios(Array.isArray(lista) ? lista : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los usuarios')
      setUsuarios([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (abierto) {
      cargar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  async function crearUsuario(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const usuarioLimpio = username.trim()
    if (!usuarioLimpio || !password.trim()) {
      setError('El usuario y la contraseña temporal son obligatorios')
      return
    }
    if (!/^[a-z0-9._-]{3,}$/i.test(usuarioLimpio)) {
      setError('El usuario debe tener al menos 3 caracteres (letras, números, punto, guion o guion bajo)')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setEnviando(true)
    try {
      await apiService.registrarUsuario({
        username: usuarioLimpio.toLowerCase(),
        password,
        nombre: nombre.trim(),
        emailRespaldo: emailRespaldo.trim() || undefined,
      })
      toast.success('Acceso creado correctamente')
      setUsername('')
      setEmailRespaldo('')
      setPassword('')
      setNombre('')
      setMostrarPassword(false)
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario')
      toast.error(err instanceof Error ? err.message : 'Error al crear el usuario')
    } finally {
      setEnviando(false)
    }
  }

  function abrirConfirmarEliminar(usuario: PerfilUsuario) {
    setConfirmarEliminar(usuario)
  }

  async function confirmarEliminarUsuario() {
    if (!confirmarEliminar?.id) return
    setEliminando(confirmarEliminar.id)
    try {
      await apiService.eliminarUsuario(confirmarEliminar.id)
      toast.success('Usuario eliminado correctamente')
      setConfirmarEliminar(null)
      await cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el usuario')
    } finally {
      setEliminando(null)
    }
  }

  if (!abierto) return null

  const inicial = (nombre: string, username: string): string => {
    const limpio = nombre.trim()
    if (limpio) {
      const partes = limpio.split(/\s+/)
      return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase()
    }
    return (username || '?').charAt(0).toUpperCase()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4"
        onClick={onCerrar}
      >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-mm-gray-900 border border-mm-gray-600 shadow-xl animate-fadeInDown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-mm-yellow px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-mm-yellow" />
            <h2 className="text-lg font-bold text-mm-yellow">Gestión de usuarios</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          {/* Crear acceso */}
          <section className="rounded-lg border border-mm-gray-700 bg-mm-gray-800 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <UserPlus className="h-4 w-4 text-mm-yellow" />
              Crear acceso de solo lectura
            </h3>
            <form onSubmit={crearUsuario} className="mt-3 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-mm-gray-400">
                    Nombre (opcional)
                  </span>
                  <input
                    className="input-dark"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ana García"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-mm-gray-400">Usuario *</span>
                  <input
                    type="text"
                    className="input-dark"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ana.garcia"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-mm-gray-400">
                    Correo de respaldo (opcional)
                  </span>
                  <input
                    type="email"
                    className="input-dark"
                    value={emailRespaldo}
                    onChange={(e) => setEmailRespaldo(e.target.value)}
                    placeholder="ana.garcia@correo.com"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-mm-gray-400">
                  Contraseña temporal *
                </span>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    className="input-dark pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-mm-gray-400 hover:text-mm-yellow transition-colors"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <p className="rounded-lg border border-mm-error/40 bg-mm-error/10 px-3 py-2 text-sm text-mm-error">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex items-center gap-1.5 rounded-lg bg-mm-yellow px-4 py-2 text-sm font-bold text-mm-black hover:bg-mm-yellow-dark disabled:opacity-60 transition-colors"
                >
                  {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {enviando ? 'Creando...' : 'Crear acceso'}
                </button>
              </div>
            </form>
          </section>

          {/* Listado de accesos */}
          <section className="rounded-lg border border-mm-gray-700 bg-mm-gray-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-mm-yellow" />
                Usuarios del sistema
                <span className="rounded-full bg-mm-gray-700 px-2 py-0.5 text-xs text-mm-gray-300">
                  {usuarios.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={cargar}
                className="flex items-center gap-1 rounded-lg border border-mm-gray-600 px-2 py-1 text-xs font-medium text-mm-gray-300 transition-colors hover:text-mm-yellow"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar
              </button>
            </div>

            {cargando ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-mm-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
                Cargando usuarios...
              </div>
            ) : usuarios.length === 0 ? (
              <p className="rounded-lg border border-dashed border-mm-gray-700 py-8 text-center text-sm text-mm-gray-400">
                Aún no hay accesos creados. Crea el primero con el formulario superior.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {usuarios.map((usuario) => (
                  <li
                    key={usuario?.id ?? Math.random()}
                    className="flex items-center gap-3 rounded-lg border border-mm-gray-700 bg-mm-gray-900 p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mm-yellow text-sm font-bold text-mm-black">
                      {inicial(usuario?.nombre ?? '', usuario?.username ?? '')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {usuario?.nombre || usuario?.username || 'Sin nombre'}
                      </p>
                      <p className="truncate text-xs text-mm-gray-400">
                        @{usuario?.username ?? ''}
                        {usuario?.emailRespaldo ? ` · ${usuario.emailRespaldo}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        usuario?.rol === 'admin'
                          ? 'border-mm-yellow/40 bg-mm-yellow/15 text-mm-yellow'
                          : 'border-mm-gray-600 bg-mm-gray-700 text-mm-gray-300'
                      }`}
                    >
                      {usuario?.rol === 'admin' ? 'Administrador' : 'Solo lectura'}
                    </span>
                    {usuario?.rol === 'lectura' && (
                      <button
                        type="button"
                        onClick={() => abrirConfirmarEliminar(usuario)}
                        disabled={eliminando === usuario?.id}
                        className="rounded-lg border border-mm-error/50 p-1.5 text-mm-error hover:bg-mm-error/10 transition-colors disabled:opacity-50"
                        aria-label={`Eliminar ${usuario?.username ?? ''}`}
                        title="Eliminar"
                      >
                        {eliminando === usuario?.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
</section>
        </div>
      </div>
    </div>

      {confirmarEliminar && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmarEliminar(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-mm-gray-900 border border-mm-error/50 shadow-xl animate-fadeInDown"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-mm-error px-6 py-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-mm-error" />
                <h2 className="text-lg font-bold text-mm-error">Confirmar eliminación</h2>
              </div>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="mb-4 text-sm text-mm-gray-300">
                ¿Estás seguro de que deseas eliminar a <strong className="text-white">
                  {confirmarEliminar.nombre || confirmarEliminar.username}
                </strong> (<strong className="text-white">@{confirmarEliminar.username}</strong>)?
              </p>
              <p className="mb-6 text-xs text-mm-gray-500">
                Esta acción es irreversible. El usuario perderá el acceso al sistema.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmarEliminar(null)}
                  disabled={eliminando === confirmarEliminar.id}
                  className="rounded-lg border border-mm-gray-600 px-4 py-2 text-sm font-semibold text-mm-gray-300 hover:bg-mm-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminarUsuario}
                  disabled={eliminando === confirmarEliminar.id}
                  className="flex items-center gap-1.5 rounded-lg bg-mm-error px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {eliminando === confirmarEliminar.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {eliminando === confirmarEliminar.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GestionUsuariosModal