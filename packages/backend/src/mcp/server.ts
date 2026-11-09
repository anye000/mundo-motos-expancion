/**
 * Servidor MCP (Model Context Protocol) de Mundo Motos CRM.
 *
 * Declara las herramientas que exponen la gestión de concesionarios y los
 * reportes del CRM a agentes de IA externos (harnesses de Digibee, asistentes
 * cloud, etc.). Las herramientas reutilizan los servicios existentes del
 * backend; el acceso a Supabase se hace con SUPABASE_SERVICE_ROLE_KEY, de
 * modo que RLS no aplica y las operaciones remotas no dependen de un JWT de
 * usuario (los JWT de Supabase expiran en ~1 hora, inviables para agentes).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as concesionarioService from '@modules/concesionarios/concesionario.service';
import {
  ConcesionarioFilters,
  CreateConcesionarioInput,
  UpdateConcesionarioInput,
} from '@modules/concesionarios/concesionario.model';
import * as reporteService from '@modules/reportes/reporte.service';
import { ReporteFilters } from '@modules/reportes/reporte.model';
import { ApiError } from '@utils/helpers';

/** Valores válidos del estado operativo de un concesionario. */
const ESTADOS = [
  'en_negociacion',
  'proximo',
  'en_ejecucion',
  'activo',
  'inactivo',
  'rechazado',
  'completado',
] as const;

/** Tipos de expansión válidos para un concesionario. */
const TIPOS_EXPANSION = ['apertura', 'ampliacion', 'relocalizacion', 'otro'] as const;

/** Formato de fecha exigido por las herramientas (YYYY-MM-DD). */
const FECHA_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Ventana por defecto de la herramienta de reportes: todo el año 2026. */
const FECHA_INICIO_2026 = '2026-01-01';
const FECHA_FIN_2026 = '2026-12-31';

/**
 * El SDK tipa `inputSchema` como ZodRawShapeCompat (zod v3 | zod v4) e
 * infiere el tipo de salida campo a campo probeando la unión completa.
 * Con shapes grandes esa inferencia agota el límite de TypeScript (TS2589) y
 * GBs de memoria. Se casta a `Record<string, never>` para que la inferencia
 * sea trivial: los schemas zod siguen intactos en runtime (validación y
 * JSON Schema para tools/list), y los handlers reciben `unknown` que se
 * castea al tipo del servicio. La validación estricta de tipos de campos es
 * redundante aquí: el servicio ya valida cada campo y lanza ApiError.
 */
type ShapeRuntime = Record<string, never>;

/** Token de servicio para las operaciones de Supabase (RLS no aplica). */
function tokenServicio(): string {
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor');
  }
  return token;
}

/** Convierte cualquier error en una respuesta MCP de error legible para el agente. */
function respuestaError(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  const mensaje =
    error instanceof ApiError || error instanceof Error
      ? error.message
      : 'Error interno del servidor';
  return { content: [{ type: 'text', text: mensaje }], isError: true };
}

/** Empaqueta un resultado como bloque de texto JSON estructurado. */
function contenidoJson(valor: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(valor, null, 2) }] };
}

/**
 * Crea una instancia de McpServer con las 5 herramientas registradas.
 *
 * Se crea una instancia por sesión SSE (cada conexión obtiene su propio
 * servidor) porque el SDK mantiene una única conexión activa por McpServer;
 * el registro de herramientas por zod es barato y evita rutas de respuesta
 * cruzadas entre sesiones concurrentes.
 */
export function crearServidorMcp(): McpServer {
  const servidor = new McpServer({ name: 'mundo-motos-crm', version: '1.0.0' });

  // ------------------------------------------------------------------
  // listar_concesionarios
  // ------------------------------------------------------------------
  const ESQUEMA_LISTAR = {
    estado: z
      .enum(ESTADOS)
      .optional()
      .describe('Estado operativo: ' + ESTADOS.join(', ')),
    ciudad: z.string().min(1).optional().describe('Filtro parcial por ciudad'),
    departamento: z.string().min(1).optional().describe('Filtro parcial por departamento'),
    page: z.number().int().positive().optional().describe('Página (1-based, por defecto 1)'),
    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .optional()
      .describe('Registros por página (por defecto 10, máximo 100)'),
  };

  servidor.registerTool(
    'listar_concesionarios',
    {
      title: 'Listar concesionarios',
      description:
        'Lee los registros de concesionarios (puntos de venta) directamente de la base de ' +
        'datos de Supabase. Excluye registros con borrado lógico. Permite filtrar por ' +
        'estado, ciudad y departamento, con paginación (limit máximo 100).',
      inputSchema: ESQUEMA_LISTAR as unknown as ShapeRuntime,
    },
    async (filtros: unknown) => {
      try {
        const resultado = await concesionarioService.getConcesionarios(
          (filtros ?? {}) as ConcesionarioFilters,
          tokenServicio()
        );
        return contenidoJson(resultado);
      } catch (error) {
        return respuestaError(error);
      }
    }
  );

  // ------------------------------------------------------------------
  // crear_concesionario
  // ------------------------------------------------------------------
  const ESQUEMA_CREAR = {
    nombre: z.string().min(1).describe('Nombre comercial del punto de venta'),
    razon_social: z.string().min(1).describe('Razón social legal'),
    rif: z
      .string()
      .regex(/^[JVG]-?\d{8}-?\d$/, 'Formato RIF inválido (ej. J-12345678-9)')
      .describe('RIF venezolano (ej. J-12345678-9)'),
    email: z.string().email().describe('Email de contacto'),
    telefono: z.string().optional().describe('Teléfono de contacto (opcional)'),
    ciudad: z.string().min(1).describe('Ciudad'),
    departamento: z.string().min(1).describe('Departamento o estado'),
    direccion: z.string().min(1).describe('Dirección física'),
    latitud: z.number().min(-90).max(90).describe('Latitud geográfica'),
    longitud: z.number().min(-180).max(180).describe('Longitud geográfica'),
    gerente_id: z.string().uuid().optional().describe('UUID del gerente asignado (opcional)'),
    estado: z
      .enum(ESTADOS)
      .optional()
      .describe('Estado operativo inicial (por defecto: activo)'),
    fecha_apertura_programada: z
      .string()
      .regex(FECHA_PATTERN, 'Debe ser una fecha YYYY-MM-DD')
      .optional()
      .describe('Fecha de apertura programada (YYYY-MM-DD, opcional)'),
    tipo_expansion: z
      .enum(TIPOS_EXPANSION)
      .optional()
      .describe('Tipo de expansión (por defecto: apertura)'),
    metadatos: z.record(z.unknown()).optional().describe('Metadatos libres (JSON, opcional)'),
  };

  servidor.registerTool(
    'crear_concesionario',
    {
      title: 'Crear concesionario',
      description:
        'Inserta un nuevo punto de venta (concesionario) en la base de datos. Requiere un ' +
        'RIF venezolano con formato J/V/G-12345678-9 (ej. J-12345678-9), email válido y ' +
        'coordenadas geográficas. El estado por defecto es "activo" y el tipo de expansión ' +
        '"apertura". El RIF debe ser único.',
      inputSchema: ESQUEMA_CREAR as unknown as ShapeRuntime,
    },
    async (entrada: unknown) => {
      try {
        const creado = await concesionarioService.createConcesionario(
          entrada as CreateConcesionarioInput,
          tokenServicio()
        );
        return contenidoJson(creado);
      } catch (error) {
        return respuestaError(error);
      }
    }
  );

  // ------------------------------------------------------------------
  // editar_concesionario
  // ------------------------------------------------------------------
  const ESQUEMA_EDITAR = {
    id: z.string().uuid().describe('UUID del concesionario a editar'),
    nombre: z.string().min(1).optional(),
    razon_social: z.string().min(1).optional(),
    email: z.string().email().optional(),
    telefono: z.string().optional(),
    ciudad: z.string().min(1).optional(),
    departamento: z.string().min(1).optional(),
    direccion: z.string().min(1).optional(),
    latitud: z.number().min(-90).max(90).optional(),
    longitud: z.number().min(-180).max(180).optional(),
    gerente_id: z.string().uuid().optional(),
    estado: z.enum(ESTADOS).optional().describe('Nuevo estado operativo'),
    fecha_apertura_programada: z
      .string()
      .regex(FECHA_PATTERN, 'Debe ser una fecha YYYY-MM-DD')
      .optional(),
    tipo_expansion: z.enum(TIPOS_EXPANSION).optional(),
    metadatos: z.record(z.unknown()).optional(),
  };

  servidor.registerTool(
    'editar_concesionario',
    {
      title: 'Editar concesionario',
      description:
        'Actualiza los datos de un concesionario existente por id (UUID). Solo se modifican ' +
        'los campos enviados. El RIF no es editable. Los cambios de estado quedan ' +
        'registrados en el historial de estados. Envía al menos un campo además del id.',
      inputSchema: ESQUEMA_EDITAR as unknown as ShapeRuntime,
    },
    async (entrada: unknown) => {
      try {
        const { id, ...updates } = entrada as UpdateConcesionarioInput & { id: string };
        const actualizado = await concesionarioService.updateConcesionario(
          id,
          updates,
          tokenServicio()
        );
        return contenidoJson(actualizado);
      } catch (error) {
        return respuestaError(error);
      }
    }
  );

  // ------------------------------------------------------------------
  // eliminar_concesionario
  // ------------------------------------------------------------------
  const ESQUEMA_ELIMINAR = {
    id: z.string().uuid().describe('UUID del concesionario a eliminar'),
  };

  servidor.registerTool(
    'eliminar_concesionario',
    {
      title: 'Eliminar concesionario',
      description:
        'Elimina físicamente un concesionario por id (UUID). ¡Operación destructiva! Las ' +
        'interacciones CRM y las expansiones vinculadas (cronograma/calendario) se ' +
        'eliminan en cascada. No hay papelera de reciclaje.',
      inputSchema: ESQUEMA_ELIMINAR as unknown as ShapeRuntime,
    },
    async (entrada: unknown) => {
      try {
        const { id } = entrada as { id: string };
        await concesionarioService.deleteConcesionario(id, tokenServicio());
        return contenidoJson({ eliminado: true, id });
      } catch (error) {
        return respuestaError(error);
      }
    }
  );

  // ------------------------------------------------------------------
  // obtener_reportes_2026
  // ------------------------------------------------------------------
  const ESQUEMA_REPORTES = {
    concesionario_id: z
      .string()
      .uuid()
      .optional()
      .describe('Filtrar por un concesionario (UUID)'),
    estado: z.enum(ESTADOS).optional().describe('Filtrar concesionarios por estado'),
    ciudad: z.string().min(1).optional().describe('Filtrar parcialmente por ciudad'),
    fecha_desde: z
      .string()
      .regex(FECHA_PATTERN, 'Debe ser una fecha YYYY-MM-DD')
      .optional()
      .describe('Inicio del rango (por defecto 2026-01-01)'),
    fecha_hasta: z
      .string()
      .regex(FECHA_PATTERN, 'Debe ser una fecha YYYY-MM-DD')
      .optional()
      .describe('Fin del rango (por defecto 2026-12-31)'),
  };

  servidor.registerTool(
    'obtener_reportes_2026',
    {
      title: 'Obtener reportes 2026',
      description:
        'Consulta el estado del plan de expansión: aperturas programadas, interacciones CRM ' +
        '(llamadas, visitas, notas rápidas, incidencias) y rendimiento agregado por ' +
        'concesionario. Por defecto cubre del 2026-01-01 al 2026-12-31; cualquier fecha ' +
        'que se envíe usa formato YYYY-MM-DD y sobreescribe ese extremo del rango.',
      inputSchema: ESQUEMA_REPORTES as unknown as ShapeRuntime,
    },
    async (filtros: unknown) => {
      try {
        const enviados = (filtros ?? {}) as ReporteFilters;
        const datos: ReporteFilters = {
          ...enviados,
          fecha_desde: enviados.fecha_desde ?? FECHA_INICIO_2026,
          fecha_hasta: enviados.fecha_hasta ?? FECHA_FIN_2026,
        };
        const reporte = await reporteService.getReportes(datos, tokenServicio());
        return contenidoJson({
          periodo: { desde: datos.fecha_desde, hasta: datos.fecha_hasta },
          total_concesionarios: reporte.concesionarios.length,
          aperturas: reporte.aperturas,
          interacciones: reporte.interacciones,
          rendimiento: reporte.rendimiento,
        });
      } catch (error) {
        return respuestaError(error);
      }
    }
  );

  return servidor;
}
