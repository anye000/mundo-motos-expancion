import { create } from 'zustand'
import { supabase } from '@services/supabase'
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

/** Traduce un nombre de usuario al email real (consulta previa a la autenticación). */
async function resolverEmailPorUsuario(usuario: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('resolver_email', {
    p_username: usuario.trim().toLowerCase(),
  })
  if (error) return null
  return (data as string) || null
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
      const email = await resolverEmailPorUsuario(usuario)
      if (!email) throw new Error('Usuario o contraseña incorrectos')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!data.user) throw new Error('No se pudo iniciar sesión')
      const perfil = await obtenerPerfil(data.user.id)
      localStorage.setItem('authToken', data.session.access_token)
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