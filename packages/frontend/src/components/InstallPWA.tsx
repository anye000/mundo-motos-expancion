import { useEffect, useState, useCallback } from 'react'
import { Download, X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const DISMISSED_KEY = 'mundo-motos-pwa-dismissed'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [yaInstalado, setYaInstalado] = useState(false)
  const [mostrar, setMostrar] = useState(true)
  const [mostrarGuia, setMostrarGuia] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setYaInstalado(true)
      return
    }

    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed === 'true') {
      setMostrar(false)
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const installedHandler = () => {
      setYaInstalado(true)
      setDeferredPrompt(null)
      setMostrar(false)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setYaInstalado(true)
        setMostrar(false)
      }
      setDeferredPrompt(null)
    } else {
      setMostrarGuia(true)
    }
  }, [deferredPrompt])

  const cerrar = useCallback(() => {
    setMostrar(false)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }, [])

  if (yaInstalado || !mostrar) return null

  const boton = (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={instalar}
        className="flex items-center gap-2.5 rounded-xl border-2 border-mm-yellow bg-black px-5 py-3 text-mm-yellow shadow-lg shadow-mm-yellow/10 transition-all hover:scale-105 hover:bg-mm-yellow hover:text-mm-black hover:shadow-xl hover:shadow-mm-yellow/20 active:scale-95"
      >
        <Download className="h-5 w-5" />
        <span className="text-sm font-bold">Instalar App</span>
      </button>
      <button
        type="button"
        onClick={cerrar}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-mm-gray-800 border border-mm-gray-600 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors shadow-lg"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )

  if (mostrarGuia) {
    return createPortal(
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
        onClick={() => setMostrarGuia(false)}
      >
        <div
          className="w-full max-w-md rounded-xl bg-mm-gray-900 border border-mm-gray-600 shadow-xl animate-fadeInDown"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b-2 border-mm-yellow px-6 py-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-mm-yellow" />
              <h2 className="text-lg font-bold text-mm-yellow">Instalar Mundo Motos</h2>
            </div>
            <button
              type="button"
              onClick={() => setMostrarGuia(false)}
              className="rounded-lg p-1 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <p className="text-sm text-mm-gray-200">
              Tu navegador no muestra el aviso automático de instalación.
              Sigue estos pasos según tu dispositivo:
            </p>

            <div className="rounded-lg bg-mm-gray-800 border border-mm-gray-700 p-4 space-y-3">
              <div>
                <p className="font-semibold text-mm-yellow flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-mm-yellow/20 flex items-center justify-center text-xs font-bold">1</span>
                  Android (Chrome)
                </p>
                <p className="mt-1 text-sm text-mm-gray-300">
                  Menú (⋮) → «Instalar aplicación» o «Añadir a pantalla de inicio»
                </p>
              </div>
              <div>
                <p className="font-semibold text-mm-yellow flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-mm-yellow/20 flex items-center justify-center text-xs font-bold">2</span>
                  iOS (Safari)
                </p>
                <p className="mt-1 text-sm text-mm-gray-300">
                  Botón Compartir (□↑) → «Añadir a pantalla de inicio»
                </p>
              </div>
              <div>
                <p className="font-semibold text-mm-yellow flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-mm-yellow/20 flex items-center justify-center text-xs font-bold">3</span>
                  Escritorio (Chrome/Edge)
                </p>
                <p className="mt-1 text-sm text-mm-gray-300">
                  Icono «Instalar» en barra de direcciones o Menú (⋮) → «Instalar Mundo Motos»
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarGuia(false)}
              className="w-full rounded-lg bg-mm-yellow px-4 py-2.5 text-sm font-bold text-mm-black hover:bg-mm-yellow/90 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return boton
}
