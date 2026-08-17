-- Migración 014: eliminación de usuarios sin SERVICE ROLE.
--
-- Reemplaza la dependencia de `auth.admin.deleteUser` (que exige la clave de
-- rol de servicio) por un RPC SECURITY DEFINER controlado por el backend:
-- borra el registro en `auth.users` y en `public.profiles`.
--
-- Seguridad:
--   * Solo un administrador autenticado puede invocarlo (comprueba is_admin()).
--   * Nunca permite eliminar usuarios con rol 'admin'.
--   * El trigger handle_new_user NO se ejecuta al borrar (solo en INSERT).
--
-- Aplicar en el SQL editor de Supabase.

CREATE OR REPLACE FUNCTION public.eliminar_usuario_auth(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol TEXT;
BEGIN
  -- Solo administradores pueden eliminar accesos.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no_admin';
  END IF;

  -- Verificar que el usuario existe y no es admin
  SELECT rol INTO v_rol FROM public.profiles WHERE id = p_user_id;
  
  IF v_rol IS NULL THEN
    RAISE EXCEPTION 'usuario_no_encontrado';
  END IF;
  
  IF v_rol = 'admin' THEN
    RAISE EXCEPTION 'no_eliminar_admin';
  END IF;

  -- Borrar de auth.users (cascada a profiles via FK profiles_id_fkey)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  -- Asegurar limpieza en profiles (por si no hay cascade)
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_usuario_auth(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eliminar_usuario_auth(UUID) TO authenticated;