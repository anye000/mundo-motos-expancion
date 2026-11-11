-- Migración 023: ficha de control de franquicias y aliados 2026
--
-- Incorpora a `concesionarios` los campos del consolidado Excel
-- "Control_Franquicias_Aliados2026_MundoMoto.xlsx" (hoja "Control de Aliados"):
-- identificación del aliado, condiciones comerciales y pago, operación y
-- seguimiento, y trazabilidad de la fuente del registro.
--
-- También reemplaza la RPC `actualizar_concesionario_con_historial` para:
--   1) Ampliar la lista blanca de columnas editables con los campos nuevos.
--   2) Incluir los campos de la migración 022 (tier_inversion, monto_inversion,
--      hitos_apertura) que no estaban en la lista blanca original, por lo que
--      su edición fallaba con "Columna no permitida en actualización".
--   3) Tipar cada grupo de columnas (fechas, numéricos, enteros, booleanos,
--      jsonb) con conversión segura de '' a NULL.

-- ------------------------------------------------------------------
-- 1) Identificación del aliado
-- ------------------------------------------------------------------
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS persona_contacto TEXT;

-- ------------------------------------------------------------------
-- 2) Condiciones comerciales y pago
-- ------------------------------------------------------------------
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS contrato_firmado BOOLEAN;
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS monto_franquicia_usd NUMERIC
  CHECK (monto_franquicia_usd >= 0);
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS forma_pago TEXT;
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS fecha_apertura DATE;
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS dias_credito INTEGER
  CHECK (dias_credito >= 0);
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS vencimiento_credito DATE;
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS monto_pagado_usd NUMERIC
  CHECK (monto_pagado_usd >= 0);
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS saldo_pendiente_usd NUMERIC
  CHECK (saldo_pendiente_usd >= 0);
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS estatus_pago TEXT;

-- ------------------------------------------------------------------
-- 3) Operación y seguimiento
-- ------------------------------------------------------------------
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS num_motos_inicial INTEGER
  CHECK (num_motos_inicial >= 0);
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS fecha_renovacion_contrato DATE;
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- ------------------------------------------------------------------
-- 4) Trazabilidad del consolidado
-- ------------------------------------------------------------------
ALTER TABLE concesionarios ADD COLUMN IF NOT EXISTS fuente TEXT;

-- ------------------------------------------------------------------
-- 5) RPC atómica: actualiza concesionarios + registra el cambio de estado.
--    SECURITY DEFINER para omitir RLS. Lista blanca ampliada con todos los
--    campos editables actuales y casts tipados por grupo de columnas.
-- ------------------------------------------------------------------
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
    'fecha_renovacion_contrato', 'observaciones', 'fuente'
  ];
  v_fechas text[] := ARRAY[
    'fecha_apertura_programada', 'fecha_apertura', 'vencimiento_credito',
    'fecha_renovacion_contrato'
  ];
  v_numericos text[] := ARRAY[
    'latitud', 'longitud', 'monto_inversion', 'monto_franquicia_usd',
    'monto_pagado_usd', 'saldo_pendiente_usd'
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
