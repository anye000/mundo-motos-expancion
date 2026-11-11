/** Tipos del módulo Concesionarios alineados con el backend (snake_case). */

export type EstadoOperativo =
  | 'en_negociacion'
  | 'proximo'
  | 'en_ejecucion'
  | 'activo'
  | 'inactivo'
  | 'rechazado'
  | 'completado';

export type TipoExpansion = 'apertura' | 'ampliacion' | 'relocalizacion' | 'otro';

/** Niveles de inversión habilitados para el plan de expansión 2026. */
export type TipoInversion = 'Lite-25K' | 'Mid-35K' | 'Max-50K';

/** Hito individual del control de apertura por etapas. */
export interface HitoApertura {
  hito: string;
  completado: boolean;
}

export interface Concesionario {
  id: string;
  nombre: string;
  razon_social: string;
  rif: string;
  email: string;
  telefono: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id: string | null;
  estado: EstadoOperativo;
  fecha_apertura_programada: string | null;
  tipo_expansion: string;
  metadatos: Record<string, unknown> | null;
  image_url?: string | null;
  /** Nivel de inversión asignado al concesionario (plan 2026). */
  tier_inversion: TipoInversion | null;
  /** Monto de inversión asignado (moneda local). */
  monto_inversion: number | null;
  /** Hitos de apertura completados/pendientes (etapas de la obra). */
  hitos_apertura: HitoApertura[] | null;
  /** Persona de contacto del aliado (ficha de control 2026). */
  persona_contacto: string | null;
  /** Contrato de franquicia firmado (Sí/No). */
  contrato_firmado: boolean | null;
  /** Monto de la franquicia en US$ (ficha de control 2026). */
  monto_franquicia_usd: number | null;
  /** Forma de pago acordada (Contado, Crédito, Mixto, Otro). */
  forma_pago: string | null;
  /** Fecha real de apertura/contrato (columna "FECHA DE APERTURA" del Excel). */
  fecha_apertura: string | null;
  /** Días de crédito otorgados para repuestos. */
  dias_credito: number | null;
  /** Vencimiento del crédito otorgado. */
  vencimiento_credito: string | null;
  /** Monto pagado de la franquicia en US$. */
  monto_pagado_usd: number | null;
  /** Saldo pendiente de la franquicia en US$. */
  saldo_pendiente_usd: number | null;
  /** Estatus del pago (Cancelado, Al día, Pendiente). */
  estatus_pago: string | null;
  /** Número de motos del inventario inicial. */
  num_motos_inicial: number | null;
  /** Fecha de renovación del contrato de franquicia. */
  fecha_renovacion_contrato: string | null;
  /** Observaciones de la ficha de control. */
  observaciones: string | null;
  /** Fuente del registro (Control + Reporte, Solo Reporte, Solo Control). */
  fuente: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateConcesionarioInput {
  nombre: string;
  razon_social: string;
  rif: string;
  email: string;
  telefono?: string | null;
  ciudad: string;
  departamento: string;
  direccion: string;
  latitud: number;
  longitud: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  fecha_apertura_programada?: string | null;
  tipo_expansion?: TipoExpansion;
  metadatos?: Record<string, unknown> | null;
  tier_inversion?: TipoInversion | null;
  monto_inversion?: number | null;
  hitos_apertura?: HitoApertura[] | null;
  persona_contacto?: string | null;
  contrato_firmado?: boolean | null;
  monto_franquicia_usd?: number | null;
  forma_pago?: string | null;
  fecha_apertura?: string | null;
  dias_credito?: number | null;
  vencimiento_credito?: string | null;
  monto_pagado_usd?: number | null;
  saldo_pendiente_usd?: number | null;
  estatus_pago?: string | null;
  num_motos_inicial?: number | null;
  fecha_renovacion_contrato?: string | null;
  observaciones?: string | null;
  fuente?: string | null;
}

export interface UpdateConcesionarioInput {
  nombre?: string;
  razon_social?: string;
  rif?: string;
  email?: string;
  telefono?: string | null;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  gerente_id?: string | null;
  estado?: EstadoOperativo;
  fecha_apertura_programada?: string | null;
  tipo_expansion?: TipoExpansion;
  metadatos?: Record<string, unknown> | null;
  tier_inversion?: TipoInversion | null;
  monto_inversion?: number | null;
  hitos_apertura?: HitoApertura[] | null;
  persona_contacto?: string | null;
  contrato_firmado?: boolean | null;
  monto_franquicia_usd?: number | null;
  forma_pago?: string | null;
  fecha_apertura?: string | null;
  dias_credito?: number | null;
  vencimiento_credito?: string | null;
  monto_pagado_usd?: number | null;
  saldo_pendiente_usd?: number | null;
  estatus_pago?: string | null;
  num_motos_inicial?: number | null;
  fecha_renovacion_contrato?: string | null;
  observaciones?: string | null;
  fuente?: string | null;
}

export interface ConcesionarioFilters {
  estado?: EstadoOperativo;
  ciudad?: string;
  departamento?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedConcesionarios {
  data: Concesionario[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Coordenadas geográficas (lat/lng). */
export interface Coordenadas {
  lat: number;
  lng: number;
}

/** Entrada del historial de cambios de estado de un concesionario. */
export interface HistorialEstado {
  id: string;
  concesionario_id: string;
  estado_anterior: EstadoOperativo | null;
  estado_nuevo: EstadoOperativo;
  created_at: string;
}
