/**
 * Módulo MCP: expone el CRM de Mundo Motos a agentes de IA externos
 * mediante el Model Context Protocol (transporte HTTP/SSE autenticado).
 */

export { requerirAuthMcp } from './auth';
export { crearServidorMcp } from './server';
export { montarMcpsEnExpress } from './transport';
