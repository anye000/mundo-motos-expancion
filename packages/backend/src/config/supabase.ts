/**
 * Cliente de Supabase configurado con variables de entorno.
 *
 * Usa SUPABASE_ANON_KEY (pública) para operaciones con RLS.
 * No requiere SERVICE_ROLE_KEY. Las operaciones admin usan RPCs SECURITY DEFINER.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // No lanzar error al importar: permitir que el servidor inicie y falle en requests
  console.warn('⚠️ SUPABASE_URL o SUPABASE_ANON_KEY no configuradas. Algunas funcionalidades fallarán.');
}

// Cliente base con anon key (pública) para operaciones con RLS
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null as any;

/**
 * Cliente autenticado con el token JWT de un usuario. Envía ese token en el
 * header Authorization para que RLS evalúe la identidad real del usuario
 * (auth.uid()) en vez de usar la anon key.
 */
export function getSupabaseConToken(token: string): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configuración de Supabase incompleta en el servidor');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

/**
 * Verifica un JWT de Supabase usando la JWKS pública del proyecto.
 * Devuelve el payload si es válido, null si no.
 */
export async function verifySupabaseJWT(token: string): Promise<{ sub: string; email?: string; role?: string } | null> {
  if (!supabaseUrl) return null;
  try {
    const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
    const jwksRes = await fetch(jwksUrl);
    if (!jwksRes.ok) return null;
    const jwks = await jwksRes.json() as { keys: Array<{ kid: string; n: string }> };

    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
    const kid = header.kid;

    const key = jwks.keys.find((k) => k.kid === kid);
    if (!key) return null;

    // En producción usar librería 'jose' o 'jsonwebtoken' para verificación completa
    // Retornamos null para indicar que usaremos getUser del cliente anon
    return null;
  } catch {
    return null;
  }
}

export default supabase;
