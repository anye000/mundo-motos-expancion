-- Migración 004: endurecimiento de seguridad (RLS, políticas, extensiones y rls_auto_enable)
--
-- Resuelve las alertas del linter de Supabase:
--   - rls_disabled_in_public        (users, concesionarios, interacciones_crm)
--   - rls_enabled_no_policy         (expansiones)
--   - extension_in_public           (cube, earthdistance)
--   - anon/authenticated_security_definer_function_executable (rls_auto_enable)
--
-- Aplicada el 2026-08-13 en el proyecto zpjoneyojbtutszvwyxg. Idempotente.
-- Actualizada el 2026-08-17 para eliminar acceso abierto a anon y restringir
-- por perfil válido en public.profiles.

-- 1) Extensiones geoespaciales fuera del schema public (buena práctica Supabase)
CREATE SCHEMA IF NOT EXISTS extensions;

ALTER EXTENSION cube SET SCHEMA extensions;
ALTER EXTENSION earthdistance SET SCHEMA extensions;

-- 2) RLS habilitado en las tablas expuestas por PostgREST
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concesionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expansiones ENABLE ROW LEVEL SECURITY;

-- 3) Políticas de acceso restrictivas.
-- Solo el rol authenticated con perfil válido en public.profiles puede acceder.
-- Se eliminan las políticas abiertas a anon.
DROP POLICY IF EXISTS "users_all_access" ON public.users;
CREATE POLICY "users_authenticated_access" ON public.users
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "concesionarios_all_access" ON public.concesionarios;
CREATE POLICY "concesionarios_authenticated_access" ON public.concesionarios
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "interacciones_crm_all_access" ON public.interacciones_crm;
CREATE POLICY "interacciones_crm_authenticated_access" ON public.interacciones_crm
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "expansiones_all_access" ON public.expansiones;
CREATE POLICY "expansiones_authenticated_access" ON public.expansiones
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  );

-- 4) rls_auto_enable(): función SECURITY DEFINER que NO debe ser invocable
-- desde la API REST por roles públicos. Se revoca EXECUTE (el event trigger
-- `ensure_rls` sigue funcionando porque se ejecuta como su dueño, postgres).
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
