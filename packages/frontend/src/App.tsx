import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-mm-light text-mm-primary">
        <header className="bg-mm-black border-b-4 border-mm-yellow">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-mm-yellow">Mundo Motos CRM</h1>
            <p className="text-mm-gray-300">Sistema de Gestión y Geolocalización de Concesionarios</p>
          </div>
        </header>
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<div>Dashboard - Próximamente</div>} />
            {/* Rutas serán agregadas aquí */}
          </Routes>
        </main>

        <footer className="bg-mm-black border-t-4 border-mm-yellow mt-auto">
          <div className="container mx-auto px-4 py-4 text-center text-mm-gray-400">
            <p>&copy; 2024 Mundo Motos. Todos los derechos reservados.</p>
          </div>
        </footer>

        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
