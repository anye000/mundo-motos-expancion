/**
 * Tipos del módulo de interacciones con concesionarios.
 *
 * Reflejan la tabla `interacciones_crm` (snake_case) tal como la devuelve el
 * backend de Mundo Motos.
 */

export type TipoInteraccion = 'llamada' | 'visita' | 'nota_rapida' | 'incidencia'

export interface InteraccionCrm {
  id: string
  concesionario_id: string
  tipo: TipoInteraccion
  detalles: string
  usuario_responsable: string
  created_at: string
}

export interface CreateInteraccionInput {
  concesionario_id: string
  tipo: TipoInteraccion
  detalles: string
  usuario_responsable: string
}
