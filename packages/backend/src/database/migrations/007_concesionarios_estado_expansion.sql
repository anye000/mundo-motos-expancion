-- Migración 007: concesionario como método maestro y sincronización con expansiones
--
-- 1) Amplía el estado operativo de `concesionarios` a 5 valores (activo,
--    inactivo, proximo, en_ejecucion, completado).
-- 2) Añade `fecha_apertura_programada` (DATE NULL) y `tipo_expansion`
--    (apertura/ampliacion/relocalizacion/otro, default 'apertura').
-- 3) Vincula `expansiones` con `concesionarios` vía `concesionario_id`
--    (ON DELETE CASCADE) y rellena (backfill) las filas existentes por
--    coincidencia de nombre, para que el DELETE en cascada limpie el
--    calendario.

-- 1) Estado operativo ampliado
ALTER TABLE concesionarios DROP CONSTRAINT concesionarios_estado_check;
ALTER TABLE concesionarios ADD CONSTRAINT concesionarios_estado_check
  CHECK (estado IN ('activo', 'inactivo', 'proximo', 'en_ejecucion', 'completado'));

-- 2) Nuevas columnas de concesionario
ALTER TABLE concesionarios
  ADD COLUMN fecha_apertura_programada DATE,
  ADD COLUMN tipo_expansion VARCHAR(80) NOT NULL DEFAULT 'apertura'
    CHECK (tipo_expansion IN ('apertura', 'ampliacion', 'relocalizacion', 'otro'));

-- 3) FK concesionario_id en expansiones + índice + backfill
ALTER TABLE expansiones
  ADD COLUMN concesionario_id UUID REFERENCES concesionarios(id) ON DELETE CASCADE;

CREATE INDEX idx_expansiones_concesionario_id ON expansiones(concesionario_id);

UPDATE expansiones e
  SET concesionario_id = c.id
  FROM concesionarios c
  WHERE c.nombre = e.concesionario AND c.deleted_at IS NULL AND e.concesionario_id IS NULL;
