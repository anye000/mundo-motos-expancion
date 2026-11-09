-- Migración 022: control financiero y avance automático de expansiones (2026)
--
-- 1) Campos de control financiero por concesionario (inversión 2026).
-- 2) Hitos de apertura (JSONB) para seguimiento por etapas.
-- 3) Avance automático de expansiones según estado operativo:
--    completado -> 100, proximo -> 0, en_ejecucion -> se conserva (editable).
--    Se aplica también a datos existentes.

ALTER TABLE concesionarios
  ADD COLUMN IF NOT EXISTS tier_inversion TEXT
    CHECK (tier_inversion IN ('Lite-25K', 'Mid-35K', 'Max-50K'));

ALTER TABLE concesionarios
  ADD COLUMN IF NOT EXISTS monto_inversion NUMERIC
    CHECK (monto_inversion >= 0);

ALTER TABLE concesionarios
  ADD COLUMN IF NOT EXISTS hitos_apertura JSONB DEFAULT '[]'::jsonb;

-- Función de trigger: el avance se deriva del estado operativo de la expansión.
CREATE OR REPLACE FUNCTION actualizar_avance_estado_expansion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.estado = 'completado' THEN
    NEW.avance := 100;
  ELSIF NEW.estado = 'proximo' THEN
    NEW.avance := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_avance_estado_expansion ON expansiones;
CREATE TRIGGER trg_avance_estado_expansion
  BEFORE INSERT OR UPDATE OF estado ON expansiones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_avance_estado_expansion();

-- Ajuste inmediato de datos existentes (el avance estaba estancado en 0).
UPDATE expansiones SET avance = 100 WHERE estado = 'completado';
UPDATE expansiones SET avance = 0 WHERE estado = 'proximo';
