import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Mensaje corto mostrado en el respaldo cuando algo falla. */
  mensaje?: string
  onError?: (error: Error) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Frontera de errores (ErrorBoundary) que captura errores de render/commit
 * de sus hijos y muestra un respaldo visual en lugar de dejar la pantalla en
 * blanco. Evita que un fallo puntual (p. ej. del mapa Leaflet dentro de un
 * modal) desmonte por completo el árbol de React de la aplicación.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-mm-error/40 bg-mm-error/10 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-mm-error">
            {this.props.mensaje ?? 'Ocurrió un error inesperado.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-mm-error/50 px-3 py-1 text-xs font-semibold text-mm-error hover:bg-mm-error/10 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary