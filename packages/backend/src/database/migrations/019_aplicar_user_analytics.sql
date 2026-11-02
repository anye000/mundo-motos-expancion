-- Migration 019: aplicar la tabla user_analytics al proyecto en vivo.
--
-- Basada en 017, con dos ajustes para coincidir con el contrato del código:
--   1. FK a public.users (no auth.users): los usuarios viven sincronizados en
--      ambas tablas (ver migración 016) y el borrado del perfil debe dejar los
--      eventos (ON DELETE SET NULL), no eliminarlos.
--   2. La columna JSONB es `details` (el backend analytics.service.ts inserta
--      `details` y el frontend types/analytics.ts la tipa así). Con `metadata`
--      todas las inserciones fallarían con PGRST204.
--
-- Aplicada al proyecto en vivo el 2026-11-02 vía Supabase (migración
-- gestionada `crear_user_analytics`) y confirmada en information_schema.

CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para lecturas rápidas del dashboard admin
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON public.user_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_type_date ON public.user_analytics(event_type, created_at DESC);

-- Permisos y RLS
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_analytics_all_access"
ON public.user_analytics
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT, INSERT ON public.user_analytics TO anon, authenticated;

-- Notificar recarga de schema cache a PostgREST
NOTIFY pgrst, 'reload schema';
