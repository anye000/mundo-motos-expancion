/**
 * Cliente de Supabase con rol de servicio (bypass de RLS) para gestionar
 * usuarios de Auth (crear accesos). Se crea de forma diferida para no romper
 * el arranque del backend si SUPABASE_SERVICE_ROLE_KEY aún no está configurada.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ApiError } from '@utils/helpers';

dotenv.config();

let cliente: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Respuesta JSON amigable: informa al administrador que debe inyectar la
    // clave de rol de servicio en las variables de entorno del backend (Render).
    throw new ApiError(
      'Configuración incompleta: falta SUPABASE_SERVICE_ROLE_KEY. Agrega la clave de rol de servicio (service_role) de Supabase en las variables de entorno del backend (Render) para poder gestionar usuarios.',
      503,
      'SERVICE_ROLE_MISSING'
    );
  }
  cliente = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cliente;
}

export default getSupabaseAdmin;