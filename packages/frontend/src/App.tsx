import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@store/auth'
import DashboardGerencial from '@components/dashboard/DashboardGerencial'
import DashboardConcesionarios from '@components/DashboardConcesionarios'
import CronogramaExpansions from '@components/CronogramaExpansions'
import ReportesView from '@components/ReportesView'
import Login from '@pages/Login'
import ProtectedRoute from '@components/ProtectedRoute'
import GestionUsuariosModal from '@components/GestionUsuariosModal'
import { ErrorBoundary } from '@components/ErrorBoundary'
import InstallPWA from '@components/InstallPWA'

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

function Navegacion() {
  const { usuario, esAdmin, logout } = useAuthStore()
  const navegar = useNavigate()
  const [gestionUsuarios, setGestionUsuarios] = useState(false)

  const inicial = (nombre: string, email: string): string => {
    const limpio = (nombre ?? '').trim()
    if (limpio) {
      const partes = limpio.split(/\s+/)
      return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase()
    }
    return (email ?? '?').charAt(0).toUpperCase()
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b-4 border-mm-yellow bg-black">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192x192.png"
              alt="Mundo Motos"
              className="h-10 w-auto shrink-0 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight text-mm-yellow sm:text-xl">
                Mundo Motos
              </h1>
              <p className="hidden text-xs text-mm-gray-400 md:block">
                Sistema de Gestión y Geolocalización de Concesionarios
              </p>
            </div>
          </div>

          <nav className="flex w-fit flex-wrap gap-1 rounded-xl border border-mm-gray-700 bg-mm-gray-800 p-1">
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
            {esAdmin && (
              <button
                type="button"
                onClick={() => setGestionUsuarios(true)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-mm-gray-300 transition-colors hover:bg-mm-gray-700 hover:text-white"
              >
                <Users className="h-4 w-4" />
                Usuarios
              </button>
            )}
          </nav>
        </div>

        {usuario && (
          <div className="container mx-auto flex items-center justify-between gap-3 px-4 pb-2">
            <div className="flex items-center gap-2 text-xs text-mm-gray-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mm-yellow text-xs font-bold text-mm-black">
                {inicial(usuario.nombre, usuario.email)}
              </span>
              <span className="font-semibold text-mm-gray-200">
                {usuario.nombre || usuario.email}
              </span>
              <span
                className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  esAdmin
                    ? 'border-mm-yellow/40 bg-mm-yellow/15 text-mm-yellow'
                    : 'border-mm-gray-600 bg-mm-gray-700 text-mm-gray-300'
                }`}
              >
                {esAdmin ? <ShieldCheck className="h-3 w-3" /> : null}
                {esAdmin ? 'Administrador' : 'Lectura'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                void logout().then(() => navegar('/login', { replace: true }))
              }}
              className="flex items-center gap-1.5 rounded-lg border border-mm-gray-600 px-2.5 py-1 text-xs font-semibold text-mm-gray-300 transition-colors hover:border-mm-yellow hover:text-mm-yellow"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <ErrorBoundary mensaje="Error al cargar la gestión de usuarios.">
        <GestionUsuariosModal abierto={gestionUsuarios} onCerrar={() => setGestionUsuarios(false)} />
      </ErrorBoundary>
    </>
  )
}

function App() {
  const inicializar = useAuthStore((estado) => estado.inicializar)

  useEffect(() => {
    void inicializar()
  }, [inicializar])

  return (
    <Router>
      <ErrorBoundary mensaje="La aplicación encontró un error inesperado.">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen flex-col bg-black text-white">
                  <Navegacion />
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
                  <InstallPWA />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ErrorBoundary>
      <Toaster position="top-right" />
    </Router>
  )
}

export default App