import { create } from 'zustand'
import { supabase } from '@services/supabase'
import { apiService } from '@services/api'
import { PerfilUsuario } from '../types/auth'

/** Limita una promesa con un tiempo máximo; evita que la sesión se quede colgada. */
function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms)
    promesa.then(
      (valor) => {
        clearTimeout(temporizador)
        resolve(valor)
      },
      (error) => {
        clearTimeout(temporizador)
        reject(error)
      },
    )
  })
}

/** Lee el perfil (rol) del usuario desde la tabla `public.profiles`. */
async function obtenerPerfil(userId: string): Promise<PerfilUsuario | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, nombre, rol, username, email_respaldo')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  return { ...data, emailRespaldo: data.email_respaldo } as PerfilUsuario
}

interface AuthState {
  usuario: PerfilUsuario | null
  inicializado: boolean
  cargando: boolean
  esAdmin: boolean
  inicializar: () => Promise<void>
  login: (usuario: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refrescarPerfil: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  inicializado: false,
  cargando: false,
  esAdmin: false,

  inicializar: async () => {
    if (get().inicializado) return
    try {
      const {
        data: { session },
      } = await conTimeout(supabase.auth.getSession(), 8000)
      let usuario: PerfilUsuario | null = null
      if (session?.user) {
        usuario = await conTimeout(obtenerPerfil(session.user.id), 8000)
        // Token para los endpoints del backend que exigen autenticación.
        localStorage.setItem('authToken', session.access_token)
      }
      set({
        usuario,
        inicializado: true,
        esAdmin: usuario?.rol === 'admin',
      })
    } catch {
      // Si la verificación falla o se agota el tiempo, se asume sesión inactiva:
      // se marca como inicializado para renderizar el login en lugar de quedar colgado.
      localStorage.removeItem('authToken')
      set({ usuario: null, inicializado: true, esAdmin: false })
    }

    supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (sesion?.user) {
        void get().refrescarPerfil()
        localStorage.setItem('authToken', sesion.access_token)
      } else {
        localStorage.removeItem('authToken')
        set({ usuario: null, esAdmin: false })
      }
    })
  },

  login: async (usuario, password) => {
    set({ cargando: true })
    try {
      const response = await apiService.post<{
        access_token: string
        refresh_token: string
        user: PerfilUsuario
      }>('/auth/login', { identifier: usuario, password })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Usuario o contraseña incorrectos')
      }

      const { access_token, refresh_token, user: perfil } = response.data

      // Establecer la sesión en Supabase JS SDK para que getSession/onAuthStateChange funcionen.
      await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      localStorage.setItem('authToken', access_token)
      set({
        usuario: perfil,
        esAdmin: perfil?.rol === 'admin',
        inicializado: true,
      })
    } finally {
      set({ cargando: false })
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('authToken')
    set({ usuario: null, esAdmin: false })
  },

  refrescarPerfil: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const usuario = await obtenerPerfil(user.id)
    set({
      usuario,
      esAdmin: usuario?.rol === 'admin',
    })
  },
}))