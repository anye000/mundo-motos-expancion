import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Bike, BarChart3, CalendarDays, LayoutDashboard, MapPin, type LucideIcon } from 'lucide-react'
import DashboardGerencial from '@components/DashboardGerencial'
import DashboardConcesionarios from '@components/DashboardConcesionarios'
import CronogramaExpansions from '@components/CronogramaExpansions'
import ReportesView from '@components/ReportesView'

interface LinkNav {
  to: string
  etiqueta: string
  icono: LucideIcon
  fin?: boolean
}

const LINKS: LinkNav[] = [
  { to: '/', etiqueta: 'Dashboard', icono: LayoutDashboard, fin: true },
  { to: '/concesionarios', etiqueta: 'Concesionarios', icono: MapPin },
  { to: '/expansiones', etiqueta: 'Cronograma 2026', icono: CalendarDays },
  { to: '/reportes', etiqueta: 'Reportes', icono: BarChart3 },
]

function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-black text-white">
        <header className="sticky top-0 z-40 border-b-4 border-mm-yellow bg-black">
          <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
                <Bike className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-lg font-bold leading-tight text-mm-yellow sm:text-xl">
                  Mundo Motos CRM
                </h1>
                <p className="hidden text-xs text-mm-gray-400 md:block">
                  Sistema de Gestión y Geolocalización de Concesionarios
                </p>
              </div>
            </div>

            <nav className="flex w-fit gap-1 rounded-xl border border-mm-gray-700 bg-mm-gray-800 p-1">
              {LINKS.map(({ to, etiqueta, icono: Icono, fin }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={fin}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-mm-yellow text-mm-black'
                        : 'text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white'
                    }`
                  }
                >
                  <Icono className="h-4 w-4" />
                  {etiqueta}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="container mx-auto flex-1 px-4 py-8">
          <Routes>
            <Route path="/" element={<DashboardGerencial />} />
            <Route path="/concesionarios" element={<DashboardConcesionarios />} />
            <Route path="/expansiones" element={<CronogramaExpansions />} />
            <Route path="/reportes" element={<ReportesView />} />
          </Routes>
        </main>

        <footer className="mt-auto border-t-4 border-mm-yellow bg-black">
          <div className="container mx-auto px-4 py-4 text-center text-mm-gray-500">
            <p>&copy; 2026 Mundo Motos. Todos los derechos reservados.</p>
          </div>
        </footer>

        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
