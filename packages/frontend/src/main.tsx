import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary mensaje="Ocurrió un error en la aplicación. Recarga la página para continuar.">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
