import { useEffect, useState, useCallback } from 'react'
import { Download, X, Smartphone, Monitor, Chrome } from 'lucide-react'

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
  const [modalAbierto, setModalAbierto] = useState(false)
  const [oculto, setOculto] = useState(false)
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
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setYaInstalado(true)
      }
      setDeferredPrompt(null)
      return
    }
    setModalAbierto(true)
  }, [deferredPrompt])

  if (oculto || yaInstalado) return null

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setOculto(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-mm-gray-600 bg-mm-gray-800 text-mm-gray-400 transition-colors hover:border-mm-yellow hover:text-mm-yellow"
          aria-label="Ocultar botón"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void instalar()}
          className="flex items-center gap-2.5 rounded-xl border-2 border-mm-yellow bg-black px-5 py-3 text-mm-yellow shadow-lg shadow-mm-yellow/10 transition-all hover:scale-105 hover:bg-mm-yellow hover:text-mm-black hover:shadow-xl hover:shadow-mm-yellow/20 active:scale-95"
        >
          <Download className="h-5 w-5" />
          <span className="text-sm font-bold">Instalar App</span>
        </button>
      </div>

      {modalAbierto && <ModalInstalacion onCerrar={() => setModalAbierto(false)} />}
    </>
  )
}

function ModalInstalacion({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onCerrar}
      onKeyDown={(e) => e.key === 'Escape' && onCerrar()}
      role="dialog"
      aria-modal="true"
      aria-label="Instrucciones de instalación"
    >
      <div
        className="w-full max-w-lg rounded-2xl border-2 border-mm-yellow bg-black p-6 sm:p-8 shadow-2xl shadow-mm-yellow/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-mm-yellow">
            <Download className="h-5 w-5" />
            Instalar Mundo Motos CRM
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-mm-gray-600 text-mm-gray-400 transition-colors hover:border-mm-yellow hover:text-mm-yellow"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-mm-gray-300">
          Instala la aplicación en tu dispositivo para acceso rápido sin abrir el navegador.
        </p>

        <div className="mt-5 space-y-4">
          <InstruccionPaso
            icono={<Smartphone className="h-5 w-5" />}
            titulo="Android (Chrome)"
            pasos={[
              'Toca el menú de tres puntos (⋮) en la esquina superior derecha.',
              'Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio".',
              'Confirma tocando "Instalar".',
            ]}
          />

          <InstruccionPaso
            icono={<Smartphone className="h-5 w-5" />}
            titulo="iPhone / iPad (Safari)"
            pasos={[
              'Abre esta página en Safari.',
              'Toca el ícono de compartir (cuadrado con flecha) en la barra inferior.',
              'Selecciona "Añadir a pantalla de inicio".',
              'Confirma tocando "Añadir" en la esquina superior derecha.',
            ]}
          />

          <InstruccionPaso
            icono={<Monitor className="h-5 w-5" />}
            titulo="Escritorio (Chrome / Edge)"
            pasos={[
              'Haz clic en el ícono de instalación en la barra de dirección (ícono de monitor con flecha).',
              'O bien, ve a ⋮ → "Instalar Mundo Motos CRM".',
              'Confirma la instalación.',
            ]}
          />
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-6 w-full rounded-xl border-2 border-mm-yellow bg-mm-yellow py-2.5 text-sm font-bold text-mm-black transition-colors hover:bg-mm-yellow-dark"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}

function InstruccionPaso({
  icono,
  titulo,
  pasos,
}: {
  icono: React.ReactNode
  titulo: string
  pasos: string[]
}) {
  return (
    <div className="rounded-xl border border-mm-gray-700 bg-mm-gray-800/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-mm-yellow">{icono}</span>
        <h3 className="text-sm font-bold text-white">{titulo}</h3>
      </div>
      <ol className="space-y-1 pl-1">
        {pasos.map((paso, i) => (
          <li key={i} className="flex gap-2 text-xs text-mm-gray-300">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mm-yellow/20 text-[10px] font-bold text-mm-yellow">
              {i + 1}
            </span>
            {paso}
          </li>
        ))}
      </ol>
    </div>
  )
}
