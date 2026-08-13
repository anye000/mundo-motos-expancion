import { FormEvent, useEffect, useState } from 'react'
import { History, Loader2, MessageSquarePlus, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { apiService } from '@services/api'
import { useInteracciones } from '@hooks/useInteracciones'
import { TipoInteraccion } from '../types/interaccion'
import { Usuario } from '../types/usuario'

const TIPO_CONFIG: Record<TipoInteraccion, { label: string; className: string }> = {
  llamada: { label: 'Llamada', className: 'bg-mm-info/15 text-mm-info border-mm-info/30' },
  visita: { label: 'Visita', className: 'bg-mm-warning/15 text-mm-warning border-mm-warning/30' },
  nota_rapida: {
    label: 'Nota rápida',
    className: 'bg-mm-success/15 text-mm-success border-mm-success/30',
  },
  incidencia: { label: 'Incidencia', className: 'bg-mm-error/15 text-mm-error border-mm-error/30' },
}

const TIPOS = Object.keys(TIPO_CONFIG) as TipoInteraccion[]

export interface HistorialInteraccionesProps {
  concesionarioId: string
}

/**
 * Historial de interacciones de un concesionario: form rápido (tipo, usuario
 * responsable y detalles) + listado cronológico de las interacciones.
 */
export function HistorialInteracciones({ concesionarioId }: HistorialInteraccionesProps) {
  const { interacciones, cargando, error, recargar } = useInteracciones(concesionarioId)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoInteraccion>('llamada')
  const [usuarioResponsable, setUsuarioResponsable] = useState('')
  const [detalles, setDetalles] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true
    apiService
      .getUsuarios()
      .then((lista) => {
        if (!activo) return
        setUsuarios(lista)
        if (lista.length > 0) {
          setUsuarioResponsable((prev) => prev || lista[0].id)
        }
      })
      .catch((e) => {
        if (activo) {
          setErrorUsuarios(e instanceof Error ? e.message : 'Error al cargar los usuarios')
        }
      })
    return () => {
      activo = false
    }
  }, [])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!usuarioResponsable) {
      toast.error('Selecciona el usuario responsable')
      return
    }
    if (!detalles.trim()) {
      toast.error('Escribe los detalles de la interacción')
      return
    }
    setEnviando(true)
    try {
      await apiService.createInteraccion({
        concesionario_id: concesionarioId,
        tipo,
        detalles: detalles.trim(),
        usuario_responsable: usuarioResponsable,
      })
      toast.success('Interacción registrada')
      setDetalles('')
      setTipo('llamada')
      recargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar la interacción')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <History className="h-4 w-4 text-mm-yellow" />
        Historial de interacciones
      </h3>

      {/* Formulario rápido */}
      <form
        onSubmit={guardar}
        className="flex flex-col gap-3 rounded-lg border border-mm-gray-700 bg-mm-gray-900 p-4"
      >
        <p className="flex items-center gap-2 text-xs font-semibold text-mm-yellow">
          <MessageSquarePlus className="h-4 w-4" />
          Nueva interacción
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">Tipo</span>
            <select
              className="input-dark"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoInteraccion)}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_CONFIG[t].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mm-gray-400">
              Usuario responsable
            </span>
            <select
              className="input-dark"
              value={usuarioResponsable}
              onChange={(e) => setUsuarioResponsable(e.target.value)}
            >
              {usuarios.length === 0 && !errorUsuarios && <option value="">Cargando usuarios...</option>}
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido} · {u.rol}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-mm-gray-400">Detalles</span>
          <textarea
            className="input-dark min-h-[72px] resize-y"
            value={detalles}
            onChange={(e) => setDetalles(e.target.value)}
            placeholder="Describe la llamada, visita, nota o incidencia..."
          />
        </label>
        {errorUsuarios && <p className="text-xs text-mm-error">{errorUsuarios}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center gap-1.5 rounded-lg bg-mm-yellow px-4 py-2 text-sm font-bold text-mm-black hover:bg-mm-yellow-dark disabled:opacity-50 transition-colors"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {enviando ? 'Registrando...' : 'Registrar interacción'}
          </button>
        </div>
      </form>

      {/* Listado */}
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-mm-error/10 border border-mm-error/40 px-4 py-3">
          <p className="text-sm text-mm-error">{error}</p>
          <button
            type="button"
            onClick={recargar}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error hover:bg-mm-error/10 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-mm-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
          Cargando historial...
        </div>
      ) : interacciones.length === 0 ? (
        <p className="rounded-lg border border-dashed border-mm-gray-700 py-8 text-center text-sm text-mm-gray-400">
          Aún no hay interacciones registradas para este concesionario.
        </p>
      ) : (
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {interacciones.map((interaccion) => {
            const config = TIPO_CONFIG[interaccion.tipo]
            const usuario = usuarios.find((u) => u.id === interaccion.usuario_responsable)
            return (
              <li
                key={interaccion.id}
                className="rounded-lg border border-mm-gray-700 bg-mm-gray-900 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${config.className}`}
                  >
                    {config.label}
                  </span>
                  <time className="text-xs text-mm-gray-400">
                    {format(new Date(interaccion.created_at), "d 'de' MMMM yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-mm-gray-200">
                  {interaccion.detalles}
                </p>
                <p className="mt-2 text-xs text-mm-gray-400">
                  {usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario no disponible'}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default HistorialInteracciones
