import { create } from 'zustand'
import { supabase } from '@services/supabase'
import { PerfilUsuario } from '../types/auth'

/** Lee el perfil (rol) del usuario desde la tabla `public.profiles`. */
async function obtenerPerfil(userId: string): Promise<PerfilUsuario | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, nombre, rol')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  return data as PerfilUsuario
}

interface AuthState {
  usuario: PerfilUsuario | null
  inicializado: boolean
  cargando: boolean
  esAdmin: boolean
  inicializar: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refrescarPerfil: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  inicializado: false,
  cargando: false,
  esAdmin: false,

  inicializar: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    let usuario: PerfilUsuario | null = null
    if (session?.user) {
      usuario = await obtenerPerfil(session.user.id)
      // Token para los endpoints del backend que exigen autenticación.
      localStorage.setItem('authToken', session.access_token)
    }
    set({
      usuario,
      inicializado: true,
      esAdmin: usuario?.rol === 'admin',
    })

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

  login: async (email, password) => {
    set({ cargando: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      if (!data.user) throw new Error('No se pudo iniciar sesión')
      const usuario = await obtenerPerfil(data.user.id)
      localStorage.setItem('authToken', data.session.access_token)
      set({
        usuario,
        esAdmin: usuario?.rol === 'admin',
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