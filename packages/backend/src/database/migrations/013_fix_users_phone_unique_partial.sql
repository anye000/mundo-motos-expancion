-- Migración 013: fix login "Database error querying schema" (duplicate key users_phone_key).
--
-- ROOT CAUSE (verificado en postgres_logs):
--   El error 500 "Database error querying schema" al iniciar sesión de usuarios
--   distintos al admin se debe a:
--     "duplicate key value violates unique constraint \"users_phone_key\""
--
--   Supabase Auth (GoTrue), al procesar `signInWithPassword`, normaliza por
--   defecto la columna `auth.users.phone`. Cuando un usuario tiene `phone = ''`
--   (el admin, para quien el login funcionaba) y otro usuario intenta loguearse
--   con `phone = NULL`, GoTrue internamente asigna `phone = ''`, colisionando
--   contra el índice UNIQUE `users_phone_key` (que indexa incluso '') y lanzando
--   `duplicate key` → Supabase lo envuelve como "Database error querying schema".
--
--   Resultado: SOLO el admin (único holder de `phone=''`) podía loguearse;
--   cualquier usuario de solo lectura recibía 500.
--
-- FIX (aplicar como owner del proyecto, desde el SQL editor de Supabase):
--   1) Convertir el índice UNIQUE en un índice PARCIAL que excluya tanto
--      `NULL` como cadenas vacías. PostgreSQL permite múltiples NULLs en un
--      índice parcial, por lo que GoTrue ya no colisiona al normalizar `phone`.
--   2) Normalizar `phone = NULL` en todos los usuarios (el valor lógico para
--      quien no ingresó teléfono).
--
-- Aplicar en el SQL editor de Supabase (requiere ser owner de auth.users).

-- 1) Recrear el unique como índice parcial.
ALTER TABLE auth.users DROP CONSTRAINT IF EXISTS users_phone_key;
CREATE UNIQUE INDEX users_phone_key
  ON auth.users(phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- 2) Normalizar: ningún usuario debe quedar con phone='' (valor que GoTrue
--    normaliza y que, aunque el índice parcial ya no colisiona, no es semántico
--    para un usuario sin teléfono).
UPDATE auth.users
SET phone = NULL,
    phone_change = NULL,
    phone_change_token = NULL
WHERE phone = '';
