-- Migración 000: extensiones geoespaciales y tabla `users`
--
-- Esquema alineado con docs/base-de-datos.md. Requisito previo para
-- `concesionarios` (gerente_id) e `interacciones_crm` (usuario_responsable).

CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE EXTENSION IF NOT EXISTS cube;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'operador'
    CHECK (rol IN ('admin', 'gerente', 'vendedor', 'operador')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  password_hash VARCHAR(255),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
CREATE INDEX idx_users_estado ON users(estado);

-- RLS habilitado. Las políticas de acceso (anon/authenticated full access)
-- se definen en la migración 004_rls_politicas_seguridad.sql.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
