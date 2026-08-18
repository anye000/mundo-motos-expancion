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
-- FIX APLICADO (2026-08-18):
--   1) El RPC crear_usuario_auth ahora inserta NULL en lugar de '' para phone,
--      phone_change, phone_change_token, reauthentication_token.
--   2) Se limpiaron los valores existentes: todos los phone ahora son NULL.
--   3) PostgreSQL permite múltiples NULLs en columnas UNIQUE, por lo que
--      el constraint ya no causa colisiones.
--   4) La restricción UNIQUE se conserva por si se usa phone real en el futuro.

-- Normalizar: ningún usuario debe quedar con phone='' (valor que GoTrue
-- normaliza y que colisiona en el índice UNIQUE).
UPDATE auth.users
SET phone = NULL,
    phone_change = NULL,
    phone_change_token = NULL
WHERE phone = '' OR phone IS NULL;

NOTIFY pgrst, 'reload schema';
