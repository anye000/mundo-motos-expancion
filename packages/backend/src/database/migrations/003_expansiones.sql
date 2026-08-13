-- Migración 003: tabla `expansiones`
--
-- Proyecciones y aperturas programadas de la expansión comercial de Mundo
-- Motos (hoja de ruta comercial). Alineado con el módulo `expansiones` del
-- backend (src/modules/expansiones) y con docs/base-de-datos.md.

CREATE TABLE expansiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario VARCHAR(255) NOT NULL,
  locacion VARCHAR(255) NOT NULL,
  fecha_apertura DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'proximo'
    CHECK (estado IN ('proximo', 'en_ejecucion', 'completado')),
  avance SMALLINT NOT NULL DEFAULT 0 CHECK (avance BETWEEN 0 AND 100),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_expansiones_estado ON expansiones(estado);
CREATE INDEX idx_expansiones_fecha_apertura ON expansiones(fecha_apertura);
CREATE INDEX idx_expansiones_locacion ON expansiones(locacion);
CREATE INDEX idx_expansiones_geom ON expansiones USING GIST(
  ll_to_earth(latitud, longitud)
);

-- Nota: sin datos semilla. La tabla inicia vacía para el arranque en blanco del CRM.
-- La limpieza de datos semilla previamente aplicados se hace en 005_limpiar_datos_semilla.sql.

-- RLS habilitado. Las políticas de acceso (anon/authenticated full access)
-- se definen en la migración 004_rls_politicas_seguridad.sql.
ALTER TABLE expansiones ENABLE ROW LEVEL SECURITY;
