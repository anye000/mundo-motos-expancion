/**
 * Servicio del módulo Reportes.
 *
 * Combina datos de `concesionarios`, `interacciones_crm` y `expansiones`
 * mediante el cliente de Supabase. Lanza ApiError con códigos de estado HTTP
 * adecuados; los controladores los propagan al error handler global.
 */

import { ApiError } from '@utils/helpers';
import { mapSupabaseError } from '@utils/supabase-errors';
import { getSupabaseConToken } from '@config/supabase';
import { Concesionario } from '../concesionarios/concesionario.model';
import { InteraccionCrm } from '../crm/crm.model';
import { Expansion } from '../expansiones/expansion.model';
import {
  ReporteFilters,
  ReporteData,
  InteraccionReporte,
  FilaRendimiento,
} from './reporte.model';

const LIMITE_MAX = 1000;

function validarFechaRango(fechaDesde?: string, fechaHasta?: string): void {
  if (fechaDesde && Number.isNaN(Date.parse(fechaDesde))) {
    throw new ApiError('El campo "fecha_desde" debe ser una fecha válida (YYYY-MM-DD)', 400);
  }
  if (fechaHasta && Number.isNaN(Date.parse(fechaHasta))) {
    throw new ApiError('El campo "fecha_hasta" debe ser una fecha válida (YYYY-MM-DD)', 400);
  }
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
    throw new ApiError('La fecha "desde" no puede ser mayor que "hasta"', 400);
  }
}

/**
 * Normaliza el límite superior del rango para columnas `timestamptz`
 * (ej. `created_at`). Supabase/PostgREST interpreta "2026-12-31" como
 * medianoche UTC del día, lo que descartaría todo lo ocurrido después de
 * esa hora. Se rellena hasta el cierre del día (23:59:59.999Z) para que el
 * rango "hasta" incluya el día completo. Valores que ya traen hora pasan
 * tal cual.
 */
function limiteDiaCompleto(fechaHasta: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(fechaHasta) ? `${fechaHasta}T23:59:59.999Z` : fechaHasta;
}

/**
 * Genera el reporte combinado: concesionarios filtrados, interacciones (con
 * datos del concesionario), aperturas del plan y filas de rendimiento
 * agregadas por concesionario.
 */
export async function getReportes(filters: ReporteFilters = {}, token: string): Promise<ReporteData> {
  const concesionarioId = filters.concesionario_id?.trim();
  const estado = filters.estado;
  const ciudad = filters.ciudad?.trim();
  const fechaDesde = filters.fecha_desde?.trim();
  const fechaHasta = filters.fecha_hasta?.trim();

  validarFechaRango(fechaDesde, fechaHasta);

  const hayFiltroConcesionario = Boolean(concesionarioId || estado || ciudad);

  const cliente = getSupabaseConToken(token);

  // 1) Concesionarios con filtros combinados (id, estado, ciudad).
  let queryConcesionarios = cliente
    .from('concesionarios')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);
  if (concesionarioId) {
    queryConcesionarios = queryConcesionarios.eq('id', concesionarioId);
  }
  if (estado) {
    queryConcesionarios = queryConcesionarios.eq('estado', estado);
  }
  if (ciudad) {
    queryConcesionarios = queryConcesionarios.ilike('ciudad', `%${ciudad}%`);
  }
  const { data: concesionarios, error: errorConcesionarios } = await queryConcesionarios
    .order('nombre', { ascending: true })
    .limit(500)
    .returns<Concesionario[]>();
  if (errorConcesionarios) {
    throw mapSupabaseError(errorConcesionarios, 'Error al obtener los concesionarios');
  }
  const lista = concesionarios ?? [];
  const ids = lista.map((c) => c.id);
  const nombres = lista.map((c) => c.nombre);

  // 2) Interacciones del rango (solo si hay concesionarios para filtrar).
  let interacciones: InteraccionCrm[] = [];
  if (!hayFiltroConcesionario || ids.length > 0) {
    let queryInteracciones = cliente.from('interacciones_crm').select('*');
    if (hayFiltroConcesionario) {
      queryInteracciones = queryInteracciones.in('concesionario_id', ids);
    }
    if (fechaDesde) {
      queryInteracciones = queryInteracciones.gte('created_at', fechaDesde);
    }
    if (fechaHasta) {
      queryInteracciones = queryInteracciones.lte('created_at', limiteDiaCompleto(fechaHasta));
    }
    const { data, error } = await queryInteracciones
      .order('created_at', { ascending: false })
      .limit(LIMITE_MAX)
      .returns<InteraccionCrm[]>();
    if (error) {
      throw mapSupabaseError(error, 'Error al obtener las interacciones');
    }
    interacciones = data ?? [];
  }

  // 3) Aperturas del plan en el rango. La ciudad se propaga también a
  //    `expansiones` (columna propia) para que el cruce sea consistente con
  //    el filtro aplicado a `concesionarios`. Cuando hay filtro de
  //    concesionario se cruza por `concesionario_id` (FK real) y, para filas
  //    huérfanas (concesionario_id nulo), por coincidencia exacta de nombre
  //    en JS; filtrar por nombre en la lista de Supabase es frágil con
  //    nombres que contienen comas y no distingue homónimos.
  let aperturas: Expansion[] = [];
  if (!hayFiltroConcesionario || ids.length > 0) {
    let queryAperturas = cliente.from('expansiones').select('*').is('deleted_at', null);
    if (ciudad) {
      queryAperturas = queryAperturas.ilike('ciudad', `%${ciudad}%`);
    }
    if (fechaDesde) {
      queryAperturas = queryAperturas.gte('fecha_apertura', fechaDesde);
    }
    if (fechaHasta) {
      queryAperturas = queryAperturas.lte('fecha_apertura', fechaHasta);
    }
    const { data, error } = await queryAperturas
      .order('fecha_apertura', { ascending: true })
      .limit(LIMITE_MAX)
      .returns<Expansion[]>();
    if (error) {
      throw mapSupabaseError(error, 'Error al obtener las aperturas');
    }
    aperturas = data ?? [];
    if (hayFiltroConcesionario) {
      aperturas = aperturas.filter(
        (e) =>
          (e.concesionario_id != null && ids.includes(e.concesionario_id)) ||
          nombres.includes(e.concesionario)
      );
    }
  }

  // 4) Agregación de rendimiento en JS (datos pequeños: sin N+1 perceptible).
  const concesionarioPorId = new Map(lista.map((c) => [c.id, c]));
  const interaccionesPorConcesionario = new Map<string, InteraccionCrm[]>();
  for (const interaccion of interacciones) {
    const actuales = interaccionesPorConcesionario.get(interaccion.concesionario_id) ?? [];
    actuales.push(interaccion);
    interaccionesPorConcesionario.set(interaccion.concesionario_id, actuales);
  }

  // Cada apertura se indexa una sola vez: por su FK `concesionario_id` si
  // está poblada, o por nombre exacto si viene huérfana (datos antiguos).
  const aperturasPorConcesionario = new Map<string, Expansion[]>();
  for (const apertura of aperturas) {
    const clave = apertura.concesionario_id
      ? `id:${apertura.concesionario_id}`
      : `nom:${apertura.concesionario}`;
    const actuales = aperturasPorConcesionario.get(clave) ?? [];
    actuales.push(apertura);
    aperturasPorConcesionario.set(clave, actuales);
  }
  const aperturasDe = (concesionario: Concesionario): Expansion[] =>
    aperturasPorConcesionario.get(`id:${concesionario.id}`) ??
    aperturasPorConcesionario.get(`nom:${concesionario.nombre}`) ??
    [];

  const rendimiento: FilaRendimiento[] = lista.map((concesionario) => {
    const inters = interaccionesPorConcesionario.get(concesionario.id) ?? [];
    const exps = aperturasDe(concesionario);
    const completadas = exps.filter((e) => e.estado === 'completado').length;
    const enEjecucion = exps.filter((e) => e.estado === 'en_ejecucion').length;
    // Avance derivado del estado operativo: completado = 100, proximo = 0,
    // en_ejecucion conserva el avance registrado (editable).
    const avanceDeExpansion = (e: Expansion): number => {
      if (e.estado === 'completado') return 100;
      if (e.estado === 'proximo') return 0;
      return e.avance ?? 0;
    };
    const sumaAvances = exps.reduce((acc, e) => acc + avanceDeExpansion(e), 0);
    const avancePromedio = exps.length > 0 ? sumaAvances / exps.length : 0;
    return {
      concesionario_id: concesionario.id,
      nombre: concesionario.nombre,
      ciudad: concesionario.ciudad,
      departamento: concesionario.departamento,
      estado: concesionario.estado,
      total_interacciones: inters.length,
      ultima_interaccion: inters.length > 0 ? inters[0].created_at : null,
      aperturas_programadas: exps.length,
      aperturas_completadas: completadas,
      aperturas_en_ejecucion: enEjecucion,
      avance_promedio: Math.round(avancePromedio * 10) / 10,
    };
  });

  const interaccionesReporte: InteraccionReporte[] = interacciones.map((interaccion) => {
    const concesionario = concesionarioPorId.get(interaccion.concesionario_id);
    return {
      ...interaccion,
      concesionario_nombre: concesionario?.nombre ?? 'Desconocido',
      concesionario_ciudad: concesionario?.ciudad ?? '',
      concesionario_estado: concesionario?.estado ?? 'inactivo',
    };
  });

  return {
    concesionarios: lista,
    interacciones: interaccionesReporte,
    aperturas,
    rendimiento,
  };
}
