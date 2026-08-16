/**
 * Cliente de Supabase configurado con variables de entorno.
 *
 * Usa SUPABASE_SERVICE_ROLE_KEY (recomendada para el backend, omite RLS)
 * o SUPABASE_ANON_KEY como fallback. Requiere SUPABASE_URL.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y (SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY) son requeridos');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Cliente autenticado con el token JWT de un usuario. Envía ese token en el
 * header Authorization para que RLS evalúe la identidad real del usuario
 * (auth.uid()) en vez de fallar por ser un cliente anónimo sin sesión.
 */
export function getSupabaseConToken(token: string): SupabaseClient {
  return createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

export default supabase;
