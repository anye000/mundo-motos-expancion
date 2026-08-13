-- Migración 001: tabla `concesionarios`
--
-- Esquema alineado con docs/base-de-datos.md.
-- Requisito previo: la tabla `users` debe existir (script de inicialización en
-- docs/base-de-datos.md), porque `gerente_id` referencia `users(id)`.

CREATE TABLE concesionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  nit VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  ciudad VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  direccion TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  gerente_id UUID REFERENCES users(id) ON DELETE SET NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  metadatos JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_concesionarios_gerente_id ON concesionarios(gerente_id);
CREATE INDEX idx_concesionarios_nit ON concesionarios(nit);
CREATE INDEX idx_concesionarios_estado ON concesionarios(estado);
CREATE INDEX idx_concesionarios_ciudad ON concesionarios(ciudad);
CREATE INDEX idx_concesionarios_geom ON concesionarios USING GIST(
  ll_to_earth(latitud, longitud)
);

-- RLS desactivado mientras el backend es el único cliente (sin auth).
-- Al implementar autenticación, habilitar y crear políticas por rol.
ALTER TABLE concesionarios DISABLE ROW LEVEL SECURITY;
