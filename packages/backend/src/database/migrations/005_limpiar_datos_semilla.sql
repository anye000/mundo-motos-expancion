-- Migración 005: limpieza de datos semilla
--
-- Deja las tablas users, concesionarios, interacciones_crm y expansiones en
-- blanco para un arranque limpio del CRM. Idempotente: DELETE no falla si ya
-- no hay filas. El orden respeta las dependencias de FK:
--   expansiones       (sin FK salientes)
--   interacciones_crm (FK -> concesionarios, users)
--   concesionarios    (FK -> users)
--   users
--
-- Aplicada el 2026-08-13 en el proyecto zpjoneyojbtutszvwyxg.

DELETE FROM public.expansiones;
DELETE FROM public.interacciones_crm;
DELETE FROM public.concesionarios;
DELETE FROM public.users;
