-- Migración 008: historial de estados de concesionarios
--
-- 1) Tabla `historial_estados` (auditoría de cambios de estado operativo).
-- 2) Índice en `concesionario_id` para consultas de historial por concesionario.
-- 3) RPC `actualizar_concesionario_con_historial`: actualiza el concesionario e
--    inserta el cambio de estado en la MISMA transacción (atómico).

-- 1) Tabla de auditoría
CREATE TABLE historial_estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario_id UUID NOT NULL REFERENCES concesionarios(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(20),
  estado_nuevo VARCHAR(20) NOT NULL
    CHECK (estado_nuevo IN ('activo', 'inactivo', 'proximo', 'en_ejecucion', 'completado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2) Índices
CREATE INDEX idx_historial_estados_concesionario_id ON historial_estados(concesionario_id);
CREATE INDEX idx_historial_estados_created_at ON historial_estados(created_at);

ALTER TABLE historial_estados ENABLE ROW LEVEL SECURITY;

-- Política de acceso (misma convención que el resto del CRM)
DROP POLICY IF EXISTS "historial_estados_all_access" ON public.historial_estados;
CREATE POLICY "historial_estados_all_access" ON public.historial_estados
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3) RPC atómico: actualiza concesionarios + registra el cambio de estado.
--    SECURITY DEFINER para omitir RLS (el backend opera con anon/service key).
--    Solo permite columnas de una lista blanca (evita inyección por dinámica).
CREATE OR REPLACE FUNCTION actualizar_concesionario_con_historial(
  p_id UUID,
  p_updates JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cols text[] := ARRAY[
    'nombre', 'razon_social', 'nit', 'email', 'telefono', 'ciudad', 'departamento',
    'direccion', 'latitud', 'longitud', 'gerente_id', 'estado',
    'fecha_apertura_programada', 'tipo_expansion', 'metadatos'
  ];
  v_clave text;
  v_set text := '';
  v_expr text;
  v_estado_anterior text;
  v_estado_nuevo text;
  v_fila jsonb;
BEGIN
  SELECT estado INTO v_estado_anterior
    FROM concesionarios
    WHERE id = p_id AND deleted_at IS NULL
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Concesionario no encontrado' USING ERRCODE = 'P0002';
  END IF;

  -- Registrar cambio de estado si difiere del actual
  v_estado_nuevo := p_updates->>'estado';
  IF v_estado_nuevo IS NOT NULL AND v_estado_anterior IS DISTINCT FROM v_estado_nuevo THEN
    INSERT INTO historial_estados (concesionario_id, estado_anterior, estado_nuevo)
    VALUES (p_id, v_estado_anterior, v_estado_nuevo);
  END IF;

  -- Construir la cláusula SET con valores tipados y columna en lista blanca
  FOR v_clave IN SELECT jsonb_object_keys(p_updates) LOOP
    IF NOT v_clave = ANY(v_cols) THEN
      RAISE EXCEPTION 'Columna no permitida en actualización: %', v_clave;
    END IF;

    IF v_clave IN ('latitud', 'longitud') THEN
      v_expr := format('($2->>%L)::numeric', v_clave);
    ELSIF v_clave = 'gerente_id' THEN
      v_expr := format(
        'CASE WHEN ($2->>%L) IS NULL OR ($2->>%L) = '''' THEN NULL ELSE ($2->>%L)::uuid END',
        v_clave, v_clave, v_clave
      );
    ELSIF v_clave = 'fecha_apertura_programada' THEN
      v_expr := format(
        'CASE WHEN ($2->>%L) IS NULL OR ($2->>%L) = '''' THEN NULL ELSE ($2->>%L)::date END',
        v_clave, v_clave, v_clave
      );
    ELSIF v_clave = 'metadatos' THEN
      v_expr := format('$2->%L', v_clave);
    ELSE
      v_expr := format('($2->>%L)', v_clave);
    END IF;

    IF v_set <> '' THEN v_set := v_set || ', '; END IF;
    v_set := v_set || format('%I = %s', v_clave, v_expr);
  END LOOP;

  IF v_set = '' THEN
    UPDATE concesionarios SET updated_at = now()
      WHERE id = p_id
      RETURNING to_jsonb(concesionarios) INTO v_fila;
  ELSE
    EXECUTE format('UPDATE concesionarios SET %s, updated_at = now() WHERE id = $1 RETURNING to_jsonb(concesionarios)', v_set)
      INTO v_fila USING p_id, p_updates;
  END IF;

  RETURN v_fila;
END;
$$;

REVOKE EXECUTE ON FUNCTION actualizar_concesionario_con_historial(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION actualizar_concesionario_con_historial(UUID, JSONB) TO anon, authenticated;