/**
 * Montaje del transporte HTTP/SSE del servidor MCP sobre Express.
 *
 * Usa el transporte legacy HTTP+SSE del SDK, el estándar de facto para
 * harnesses remotos (Digibee, plataformas cloud):
 *
 *   - GET  /sse                       → abre el canal servidor→agente (SSE) y
 *                                       devuelve un evento `endpoint` con la
 *                                       URL /messages?sessionId=<id>.
 *   - POST /messages?sessionId=<id>   → canal agente→servidor (JSON-RPC).
 *
 * Debe montarse ANTES de express.json en index.ts: el SDK parsea el cuerpo
 * de /messages por sí mismo y un parser previo consumiría el stream. La
 * compresión también excluye estas rutas (ver filtroCompresion en index.ts)
 * para no buferar los mensajes SSE.
 *
 * Cada sesión SSE obtiene su propia McpServer instance (el registro de
 * herramientas por zod es barato), porque el SDK mantiene una única conexión
 * activa por McpServer y sharing de la instancia dejaría respuestas de una
 * sesión viajando por el stream de otra.
 */

import { Express, Request, Response, NextFunction } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { requerirAuthMcp } from './auth';
import { crearServidorMcp } from './server';

const RUTA_EVENTOS = '/sse';
const RUTA_MENSAJES = '/messages';

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

/** POST /messages - canal JSON-RPC del agente hacia el servidor. */
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

/**
 * Monta el transporte MCP en la app Express. Se invoca desde index.ts antes
 * de los parsers de cuerpo de express.
 */
export function montarMcpsEnExpress(app: Express): void {
  if (!process.env.MCP_AUTH_TOKEN) {
    console.warn(
      '⚠️ MCP_AUTH_TOKEN no está definida: todas las peticiones MCP recibirán 401 (fail closed).'
    );
  }

  app.get(RUTA_EVENTOS, requerirAuthMcp, abrirCanalSse);
  app.post(RUTA_MENSAJES, requerirAuthMcp, recibirMensajes);

  console.log(`[MCP] Transporte MCP montado en GET ${RUTA_EVENTOS} y POST ${RUTA_MENSAJES}`);
}
