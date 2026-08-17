import { useEffect, useState, useCallback } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [mostrarBoton, setMostrarBoton] = useState(false)
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setMostrarBoton(true)
    }

    const installedHandler = () => {
      setMostrarBoton(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setMostrarBoton(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const descartar = useCallback(() => {
    setOculto(true)
  }, [])

  if (!mostrarBoton || oculto) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={descartar}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-mm-gray-600 bg-mm-gray-800 text-mm-gray-400 transition-colors hover:border-mm-yellow hover:text-mm-yellow"
        aria-label="Ocultar botón de instalación"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => void instalar()}
        className="flex items-center gap-3 rounded-2xl border-2 border-mm-yellow bg-mm-yellow px-6 py-3 text-mm-black shadow-lg shadow-mm-yellow/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-mm-yellow/30 active:scale-95"
      >
        <Download className="h-5 w-5" />
        <span className="text-sm font-bold">Instalar aplicación</span>
      </button>
    </div>
  )
}
