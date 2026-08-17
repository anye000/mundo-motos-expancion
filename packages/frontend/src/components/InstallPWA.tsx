import { useEffect, useState, useCallback } from 'react'
import { Download } from 'lucide-react'

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
  const [yaInstalado, setYaInstalado] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setYaInstalado(true)
      return
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const installedHandler = () => {
      setYaInstalado(true)
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
      setYaInstalado(true)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  if (yaInstalado || !deferredPrompt) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={() => void instalar()}
        className="flex items-center gap-2.5 rounded-xl border-2 border-mm-yellow bg-black px-5 py-3 text-mm-yellow shadow-lg shadow-mm-yellow/10 transition-all hover:scale-105 hover:bg-mm-yellow hover:text-mm-black hover:shadow-xl hover:shadow-mm-yellow/20 active:scale-95"
      >
        <Download className="h-5 w-5" />
        <span className="text-sm font-bold">Instalar App</span>
      </button>
    </div>
  )
}
