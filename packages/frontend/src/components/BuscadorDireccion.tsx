import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import { useMap } from 'react-leaflet'
import { buscarDireccion, ResultadoGeocodificacion } from '../utils/geocodificacion'

export interface BuscadorDireccionProps {
  onSeleccionar: (resultado: ResultadoGeocodificacion) => void
  placeholder?: string
}

/**
 * Buscador de direcciones estilo Google Maps sobre el mapa. Debounce de 400 ms,
 * resultados de Nominatim (Venezuela, `countrycodes=ve`), flyTo automático al
 * seleccionar y callback para que el padre (dashboard o modal) procese la
 * ubicación elegida.
 */
export function BuscadorDireccion({
  onSeleccionar,
  placeholder = 'Buscar ciudad en Venezuela...',
}: BuscadorDireccionProps) {
  const map = useMap()
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<ResultadoGeocodificacion[]>([])
  const [abierto, setAbierto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (consulta.trim().length < 3) {
      setResultados([])
      setError(null)
      setAbierto(false)
      setBuscando(false)
      return
    }

    abortRef.current?.abort()
    const controlador = new AbortController()
    abortRef.current = controlador
    setBuscando(true)
    setError(null)

    const temporizador = setTimeout(async () => {
      try {
        const r = await buscarDireccion(consulta, controlador.signal)
        setResultados(r)
        setAbierto(true)
      } catch {
        if (!controlador.signal.aborted) {
          setError('No se pudo buscar. Intenta de nuevo.')
        }
      } finally {
        if (!controlador.signal.aborted) setBuscando(false)
      }
    }, 400)

    return () => {
      clearTimeout(temporizador)
      controlador.abort()
    }
  }, [consulta])

  function seleccionar(resultado: ResultadoGeocodificacion) {
    map.flyTo([resultado.lat, resultado.lng], 15, { duration: 0.8 })
    onSeleccionar(resultado)
    setAbierto(false)
    setConsulta('')
    setResultados([])
  }

  return (
    <div className="absolute right-3 top-3 z-[1000] w-72">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mm-gray-400" />
        <input
          className="input-dark pl-9 pr-8"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          onFocus={() => {
            if (resultados.length > 0) setAbierto(true)
          }}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {consulta && (
          <button
            type="button"
            onClick={() => {
              setConsulta('')
              setResultados([])
              setAbierto(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-mm-gray-400 transition-colors hover:text-white"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {buscando && (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-mm-gray-600 bg-mm-gray-900 px-3 py-2 text-sm text-mm-gray-300 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-mm-yellow" />
          Buscando...
        </div>
      )}

      {error && (
        <div className="mt-1 rounded-lg border border-mm-error/40 bg-mm-gray-900 px-3 py-2 text-sm text-mm-error shadow-lg">
          {error}
        </div>
      )}

      {abierto && resultados.length === 0 && !buscando && !error && (
        <div className="mt-1 rounded-lg border border-mm-gray-600 bg-mm-gray-900 px-3 py-2 text-sm text-mm-gray-300 shadow-lg">
          Sin resultados para &quot;{consulta}&quot;.
        </div>
      )}

      {abierto && resultados.length > 0 && (
        <ul className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-mm-gray-600 bg-mm-gray-900 shadow-lg">
          {resultados.map((resultado, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => seleccionar(resultado)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-mm-gray-200 transition-colors hover:bg-mm-gray-800"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mm-yellow" />
                <span className="line-clamp-2">{resultado.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BuscadorDireccion
