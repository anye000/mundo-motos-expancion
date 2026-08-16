-- Migración 009: nuevos estados operativos de concesionario
--
-- Añade los estados `en_negociacion` y `rechazado` al ciclo de vida de un
-- concesionario. Amplía el CHECK de `concesionarios.estado` y el de
-- `historial_estados.estado_nuevo` para admitir el nuevo dominio completo:
-- en_negociacion, proximo, en_ejecucion, activo, inactivo, rechazado, completado.

ALTER TABLE concesionarios DROP CONSTRAINT concesionarios_estado_check;
ALTER TABLE concesionarios ADD CONSTRAINT concesionarios_estado_check
  CHECK (estado IN ('en_negociacion', 'proximo', 'en_ejecucion', 'activo', 'inactivo', 'rechazado', 'completado'));

ALTER TABLE historial_estados DROP CONSTRAINT historial_estados_estado_nuevo_check;
ALTER TABLE historial_estados ADD CONSTRAINT historial_estados_estado_nuevo_check
  CHECK (estado_nuevo IN ('en_negociacion', 'proximo', 'en_ejecucion', 'activo', 'inactivo', 'rechazado', 'completado'));