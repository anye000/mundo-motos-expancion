-- Migración 024: metros cuadrados del local (concesionario)
--
-- Añade la superficie del local en metros cuadrados a `concesionarios`
-- (petición del propietario). Amplía la RPC de actualización para incluir
-- la nueva columna en la lista blanca con cast numérico seguro.

ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS metros_cuadrados NUMERIC
  CHECK (metros_cuadrados >= 0);

-- Reemplazo de la RPC para incluir `metros_cuadrados` (heredado de 023).
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
    -- Esquema base (001/009)
    'nombre', 'razon_social', 'rif', 'email', 'telefono', 'ciudad', 'departamento',
    'direccion', 'latitud', 'longitud', 'gerente_id', 'estado',
    'fecha_apertura_programada', 'tipo_expansion', 'metadatos',
    -- Control financiero 2026 (022)
    'tier_inversion', 'monto_inversion', 'hitos_apertura',
    -- Ficha de franquicias y aliados (023)
    'persona_contacto', 'contrato_firmado', 'monto_franquicia_usd', 'forma_pago',
    'fecha_apertura', 'dias_credito', 'vencimiento_credito', 'monto_pagado_usd',
    'saldo_pendiente_usd', 'estatus_pago', 'num_motos_inicial',
    'fecha_renovacion_contrato', 'observaciones', 'fuente',
    -- Superficie del local (024)
    'metros_cuadrados'
  ];
  v_fechas text[] := ARRAY[
    'fecha_apertura_programada', 'fecha_apertura', 'vencimiento_credito',
    'fecha_renovacion_contrato'
  ];
  v_numericos text[] := ARRAY[
    'latitud', 'longitud', 'monto_inversion', 'monto_franquicia_usd',
    'monto_pagado_usd', 'saldo_pendiente_usd', 'metros_cuadrados'
  ];
  v_enteros text[] := ARRAY['dias_credito', 'num_motos_inicial'];
  v_jsonb text[] := ARRAY['metadatos', 'hitos_apertura'];
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

    IF v_clave = ANY(v_fechas) THEN
      v_expr := format(
        'CASE WHEN ($2->>%L) IS NULL OR ($2->>%L) = '''' THEN NULL ELSE ($2->>%L)::date END',
        v_clave, v_clave, v_clave
      );
    ELSIF v_clave = ANY(v_numericos) THEN
      v_expr := format(
        'CASE WHEN ($2->>%L) IS NULL OR ($2->>%L) = '''' THEN NULL ELSE ($2->>%L)::numeric END',
        v_clave, v_clave, v_clave
      );
    ELSIF v_clave = ANY(v_enteros) THEN
      v_expr := format(
        'CASE WHEN ($2->>%L) IS NULL OR ($2->>%L) = '''' THEN NULL ELSE ($2->>%L)::integer END',
        v_clave, v_clave, v_clave
      );
    ELSIF v_clave = 'contrato_firmado' THEN
      v_expr := format(
        'CASE WHEN ($2->>%L) IS NULL OR ($2->>%L) = '''' THEN NULL ELSE ($2->>%L)::boolean END',
        v_clave, v_clave, v_clave
      );
    ELSIF v_clave = 'gerente_id' THEN
      v_expr := format(
        'CASE WHEN ($2->>%L) IS NULL OR ($2->>%L) = '''' THEN NULL ELSE ($2->>%L)::uuid END',
        v_clave, v_clave, v_clave
      );
    ELSIF v_clave = ANY(v_jsonb) THEN
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
