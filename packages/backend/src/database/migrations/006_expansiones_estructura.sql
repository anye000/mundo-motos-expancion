-- Migración 006: estructura de `expansiones` para el formulario de creación
--
-- Añade campos estructurados al módulo de expansiones (src/modules/expansiones):
--   - tipo: tipo de apertura (apertura, ampliacion, relocalizacion, otro).
--   - ciudad / departamento: ubicación estructurada (Venezuela).
--
-- La columna `locacion` se conserva y el backend la compone como
-- "Ciudad, Departamento" (Enfoque A). Los DEFAULT permiten que las filas
-- existentes migren sin problema (columnas NOT NULL).

ALTER TABLE expansiones
  ADD COLUMN tipo VARCHAR(80) NOT NULL DEFAULT 'apertura',
  ADD COLUMN ciudad VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN departamento VARCHAR(255) NOT NULL DEFAULT '';

CREATE INDEX idx_expansiones_tipo ON expansiones(tipo);
CREATE INDEX idx_expansiones_ciudad ON expansiones(ciudad);
CREATE INDEX idx_expansiones_departamento ON expansiones(departamento);
