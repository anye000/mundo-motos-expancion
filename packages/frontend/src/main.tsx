import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register/react').then(({ useRegisterSW }) => {
    useRegisterSW({
      onNeedRefresh() {
        if (confirm('Hay una nueva versión disponible. ¿Recargar ahora?')) {
          window.location.reload()
        }
      },
      onOfflineReady() {
        console.log('App lista para funcionar offline')
      },
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary mensaje="Ocurrió un error en la aplicación. Recarga la página para continuar.">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
