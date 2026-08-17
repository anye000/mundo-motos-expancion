import { useEffect, useState, useCallback } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

type InstallState = 'waiting' | 'available' | 'installed' | 'unsupported'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installState, setInstallState] = useState<InstallState>('waiting')
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setInstallState('available')
    }

    const installedHandler = () => {
      setInstallState('installed')
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    const timer = setTimeout(() => {
      setInstallState((prev) => (prev === 'waiting' ? 'unsupported' : prev))
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      clearTimeout(timer)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallState('installed')
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const descartar = useCallback(() => {
    setOculto(true)
  }, [])

  if (oculto || installState === 'installed') return null

  if (installState === 'unsupported') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={descartar}
          className="group flex items-center gap-2 rounded-xl border border-mm-gray-600 bg-mm-gray-800/90 px-4 py-2.5 text-xs text-mm-gray-400 backdrop-blur-sm transition-all hover:border-mm-yellow hover:text-mm-yellow"
        >
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline">Abrir en el navegador del celular para instalar</span>
          <span className="sm:hidden">Instalar desde el celular</span>
          <X className="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
    )
  }

  if (installState === 'waiting') return null

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
