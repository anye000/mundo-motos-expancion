-- Migración 011: autenticación por nombre de usuario (username).
--
-- Estrategia transparente: Supabase Auth sigue usando email, pero el usuario
-- accede con un `username` único. Se guarda en `public.profiles.username` y se
-- vincula al email interno generado automáticamente (`username@mundomotos.internal`)
-- para los accesos creados por el admin. Un RPC `resolver_email` permite
-- traducir el username al email real (consulta previa) antes de autenticar.
--
-- Aplicar en el SQL editor de Supabase.

-- 1) Columnas nuevas en profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email_respaldo TEXT;

-- Unicidad case-insensitive del username.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));

-- 2) Relleno retroactivo: deriva el username de la parte local del email
--    (p. ej. anyelina@mundomotos.com -> anyelina).
UPDATE public.profiles
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL;

-- 3) RPC para resolver el email a partir del username (consulta previa).
--    SECURITY DEFINER para leer cualquier perfil sin recursión de RLS.
CREATE OR REPLACE FUNCTION public.resolver_email(p_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.profiles
  WHERE lower(username) = lower(p_username)
  LIMIT 1;
$$;

-- Permitir ejecución al rol anónimo (login) y autenticado.
REVOKE ALL ON FUNCTION public.resolver_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolver_email(TEXT) TO anon, authenticated;

-- 4) Trigger: captura username y email_respaldo al crear el perfil.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_email_respaldo TEXT;
BEGIN
  v_username := NULLIF(NEW.raw_user_meta_data ->> 'username', '');
  v_email_respaldo := NULLIF(NEW.raw_user_meta_data ->> 'email_respaldo', '');
  INSERT INTO public.profiles (id, email, nombre, rol, username, email_respaldo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'rol', 'lectura'),
    v_username,
    v_email_respaldo
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;