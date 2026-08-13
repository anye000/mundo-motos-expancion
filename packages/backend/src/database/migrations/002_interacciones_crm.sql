-- Migración 002: tabla `interacciones_crm`
--
-- Historial de interacciones por concesionario (llamadas, visitas, notas e
-- incidencias). Alineado con docs/base-de-datos.md y el módulo CRM del backend.
-- Requisito previo: tablas `users` (000) y `concesionarios` (001).

CREATE TABLE interacciones_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario_id UUID NOT NULL REFERENCES concesionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL
    CHECK (tipo IN ('llamada', 'visita', 'nota_rapida', 'incidencia')),
  detalles TEXT NOT NULL,
  usuario_responsable UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interacciones_crm_concesionario_id ON interacciones_crm(concesionario_id);
CREATE INDEX idx_interacciones_crm_tipo ON interacciones_crm(tipo);
CREATE INDEX idx_interacciones_crm_usuario_responsable ON interacciones_crm(usuario_responsable);
CREATE INDEX idx_interacciones_crm_created_at ON interacciones_crm(created_at);

-- RLS habilitado. Las políticas de acceso (anon/authenticated full access)
-- se definen en la migración 004_rls_politicas_seguridad.sql.
ALTER TABLE interacciones_crm ENABLE ROW LEVEL SECURITY;
