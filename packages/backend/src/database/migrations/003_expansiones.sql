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

-- Datos semilla: hoja de ruta comercial agosto/septiembre 2026.
INSERT INTO expansiones (concesionario, locacion, fecha_apertura, estado, avance, latitud, longitud, observaciones) VALUES
  ('Mundo Motos La California', 'La California, Caracas', '2026-08-20', 'en_ejecucion', 60, 10.4757, -66.8414, 'Adecuación del local en curso.'),
  ('Mundo Motos 2 Caminos', '2 Caminos, Caracas', '2026-08-28', 'proximo', 20, 10.4800, -66.8300, 'Firma de contrato de arrendamiento.'),
  ('Mundo Motos Táchira', 'San Cristóbal, Táchira', '2026-09-04', 'proximo', 10, 7.7723, -72.2250, 'Estudio de mercado en ejecución.'),
  ('Mundo Motos Maturín', 'Maturín, Monagas', '2026-09-18', 'proximo', 5, 9.7457, -63.1832, 'Selección de punto comercial.'),
  ('Mundo Motos Maracaibo', 'Maracaibo, Zulia', '2026-09-30', 'proximo', 0, 10.6544, -71.6489, 'Evaluación inicial de la plaza.'),
  ('Mundo Motos Valencia', 'Valencia, Carabobo', '2026-06-20', 'completado', 100, 10.1667, -68.0000, 'Apertura inaugurada.');

-- RLS (opcional): habilitar para restringir acceso por fila.
-- ALTER TABLE expansiones ENABLE ROW LEVEL SECURITY;
