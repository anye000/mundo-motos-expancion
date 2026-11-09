/**
 * Montaje de los transportes MCP del servidor sobre Express.
 *
 * Se exponen DOS transportes con la misma autenticación:
 *
 * 1) Legacy HTTP+SSE del SDK (estándar de facto para harnesses remotos):
 *
 *     - GET  /sse                       → abre el canal servidor→agente (SSE) y
 *                                         devuelve un evento `endpoint` con la
 *                                         URL /messages?sessionId=<id>.
 *     - POST /messages?sessionId=<id>   → canal agente→servidor (JSON-RPC).
 *
 * 2) Streamable HTTP (transporte moderno del protocolo), pensado para
 *    clientes tipo DSH que solo hablan stdio / streamable-http y conectan
 *    sin necesitad de puentes locales:
 *
 *     - POST /mcp      → JSON-RPC de ida y vuelta en JSON directo (modo
 *                        stateless: cada POST es una sesión efímera).
 *     - GET  /mcp      → 405 (no mantenemos streams servidor→agente).
 *     - DELETE /mcp    → 405 (no hay sesiones persistentes que cerrar).
 *
 * Las rutas SSE (/sse y /messages) se montan ANTES de express.json: el SDK
 * parsea el cuerpo por sí mismo y un parser previo consumiría el stream. La
 * compresión también excluye estas rutas y /mcp (ver filtroCompresion en
 * index.ts) para no buferar streamings. /mcp usa un parser inline exclusivo
 * de su endpoint y pasa el cuerpo ya parseado al SDK (req.body → parsedBody).
 *
 * Cada sesión configura su propia McpServer instance (el registro de
 * herramientas por zod es barato), porque el SDK mantiene una única conexión
 * activa por McpServer y sharing de la instancia dejaría respuestas de una
 * sesión viajando por el stream de otra.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requerirAuthMcp } from './auth';
import { crearServidorMcp } from './server';

const RUTA_EVENTOS = '/sse';
const RUTA_MENSAJES = '/messages';
const RUTA_MCP = '/mcp';

/** Sesiones SSE activas por id de sesión. */
const transportesPorSesion = new Map<string, SSEServerTransport>();

/** Cada cuánto se envía un comentario SSE para evitar cierres por inactividad (ms). */
const INTERVALO_LATIDO_MS = 15_000;

/** GET /sse - abre el canal SSE hacia el agente. */
function abrirCanalSse(_req: Request, res: Response): void {
  const servidor = crearServidorMcp();
  const transporte = new SSEServerTransport(RUTA_MENSAJES, res);
  transportesPorSesion.set(transporte.sessionId, transporte);

  // Keepalive: los proxies (Render, Nginx) cierran conexiones HTTP inactivas.
  // Un comentario SSE (`: ping`) mantiene el canal vivo sin interferir con los
  // eventos JSON-RPC: los comentarios que empiezan con ':' los ignoran los clientes.
  const latido = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // El stream ya está cerrado; el intervalo se limpia en el evento close.
    }
  }, INTERVALO_LATIDO_MS);
  latido.unref();

  const cerrarSesion = () => {
    clearInterval(latido);
    transportesPorSesion.delete(transporte.sessionId);
  };

  transporte.onclose = cerrarSesion;
  res.on('close', cerrarSesion);

  servidor.connect(transporte).catch((error: unknown) => {
    console.error('[MCP] Error al conectar la sesión SSE:', error);
    cerrarSesion();
  });
}

/** POST /messages - canal JSON-RPC del transporte legacy SSE. */
function recibirMensajes(req: Request, res: Response, next: NextFunction): void {
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : null;

  if (!sessionId || !transportesPorSesion.has(sessionId)) {
    res
      .status(404)
      .json({ success: false, error: 'Sesión MCP no encontrada. Abre primero GET /sse' });
    return;
  }

  const transporte = transportesPorSesion.get(sessionId)!;
  // Sin parsedBody: el SDK lee y parsea el stream por sí mismo (por eso este
  // endpoint debe estar montado antes de express.json).
  transporte.handlePostMessage(req, res).catch(next);
}

/** POST /mcp - transporte Streamable HTTP en modo stateless. */
async function atenderMcpStreamable(req: Request, res: Response): Promise<void> {
  // Sesión efímera por petición: servidor + transporte desechables, respuesta
  // JSON directa (enableJsonResponse). El cuerpo de la petición ya lo parseó
  // el parser inline del endpoint, así se lo pasamos ya consumido al SDK.
  const transporte = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const servidor = crearServidorMcp();
  res.on('close', () => {
    void transporte.close();
    void servidor.close();
  });
  await servidor.connect(transporte);
  await transporte.handleRequest(req, res, req.body as unknown);
}

/** HEAD-compatibles: 405 para métodos que el modo stateless no ofrece. */
function metodoNoPermitido(_req: Request, res: Response): void {
  res
    .status(405)
    .set('Allow', 'POST')
    .json({ success: false, error: 'Método no permitido en /mcp (solo POST)' });
}

/**
 * Monta los transportes MCP en la app Express. Las rutas SSE se invocan desde
 * index.ts antes de los parsers de cuerpo de express; /mcp decide su parser.
 */
export function montarMcpsEnExpress(app: Express): void {
  if (!process.env.MCP_AUTH_TOKEN) {
    console.warn(
      '⚠️ MCP_AUTH_TOKEN no está definida: todas las peticiones MCP recibirán 401 (fail closed).'
    );
  }

  // Transporte legacy HTTP+SSE (prioriza: compatible con todo harness).
  app.get(RUTA_EVENTOS, requerirAuthMcp, abrirCanalSse);
  app.post(RUTA_MENSAJES, requerirAuthMcp, recibirMensajes);

  // Transporte moderno Streamable HTTP (stateless, JSON directo).
  app.post(RUTA_MCP, requerirAuthMcp, express.json({ limit: '1mb' }), (req, res, next) => {
    atenderMcpStreamable(req, res).catch(next);
  });
  app.get(RUTA_MCP, requerirAuthMcp, metodoNoPermitido);
  app.delete(RUTA_MCP, requerirAuthMcp, metodoNoPermitido);

  console.log(
    `[MCP] Transportes MCP montados en GET ${RUTA_EVENTOS} + POST ${RUTA_MENSAJES} (legacy) y POST ${RUTA_MCP} (streamable)`
  );
}
