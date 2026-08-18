-- Migración 012: creación de usuarios sin SERVICE ROLE.
--
-- Reemplaza la dependencia de `auth.admin.createUser` (que exige la clave de
-- rol de servicio) por un RPC SECURITY DEFINER controlado por el backend:
-- inserta el registro en `auth.users` con `email_confirmed_at = now()` para
-- que el acceso sea usable de inmediato (el proyecto tiene confirmación de
-- email ON y los correos son internos, no reciben confirmación).
--
-- Seguridad:
--   * Solo un administrador autenticado puede invocarlo (comprueba is_admin()).
--   * El rol SIEMPRE se fija a 'lectura' (nunca se crean admins por este RPC).
--   * La contraseña se recibe en texto plano y se hashea con PostgreSQL's
--     native `crypt()` + `gen_salt('bf')` (pgcrypto). Esto garantiza
--     compatibilidad con GoTrue/Supabase Auth signInWithPassword.
--     ⚠️ NO usar bcryptjs de JavaScript — produce hashes incompatibles con GoTrue.
--   * El trigger handle_new_user crea el perfil en public.profiles.
--
-- Aplicar en el SQL editor de Supabase.

DROP FUNCTION IF EXISTS public.crear_usuario_auth(text, text, text, text);

CREATE OR REPLACE FUNCTION public.crear_usuario_auth(
  p_username TEXT,
  p_password TEXT,
  p_nombre TEXT DEFAULT '',
  p_email_respaldo TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_id UUID;
  v_hash TEXT;
  v_existe INTEGER;
BEGIN
  -- Solo administradores pueden crear accesos.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no_admin';
  END IF;

  IF p_username IS NULL OR NOT (p_username ~ '^[a-z0-9._-]{3,}$') THEN
    RAISE EXCEPTION 'usuario_invalido';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'password_invalida';
  END IF;

  v_email := lower(p_username) || '@internal.mundomotos.com';

  SELECT count(*) INTO v_existe FROM public.profiles WHERE lower(username) = lower(p_username);
  IF v_existe > 0 THEN
    RAISE EXCEPTION 'usuario_existe';
  END IF;
  SELECT count(*) INTO v_existe FROM auth.users WHERE email = v_email;
  IF v_existe > 0 THEN
    RAISE EXCEPTION 'usuario_existe';
  END IF;

  v_id := gen_random_uuid();

  -- Hash con pgcrypto nativo — compatible con GoTrue's signInWithPassword
  v_hash := crypt(p_password, gen_salt('bf', 10));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current,
    phone, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    email_change_confirm_status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    v_email, v_hash, now(), NULL,
    '', '', '', '', '',
    NULL, NULL, NULL, NULL, false, false, NULL,
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', 'authenticated'
    ),
    jsonb_build_object(
      'username', lower(p_username),
      'nombre', p_nombre,
      'rol', 'lectura',
      'email_respaldo', p_email_respaldo
    ),
    now(), now(), 0
  );

  RETURN jsonb_build_object('id', v_id, 'email', v_email)::json;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_usuario_auth(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_usuario_auth(text, text, text, text) TO authenticated;
