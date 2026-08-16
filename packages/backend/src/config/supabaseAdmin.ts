/**
 * Cliente de Supabase con rol de servicio (bypass de RLS) para gestionar
 * usuarios de Auth (crear accesos). Se crea de forma diferida para no romper
 * el arranque del backend si SUPABASE_SERVICE_ROLE_KEY aún no está configurada.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let cliente: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. Agrégala al .env para gestionar usuarios.'
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