# Servidor MCP - Mundo Motos CRM

El backend expone un servidor **MCP (Model Context Protocol)** para que agentes
de IA externos (harnesses de Digibee, asistentes cloud, clientes de escritorio)
consulten los concesionarios y los reportes del plan 2026.

- **Transportes**:
  - Streamable HTTP (moderno): `POST /mcp` (modo stateless, JSON directo).
  - HTTP/SSE legacy del SDK (`@modelcontextprotocol/sdk`): `GET /sse` +
    `POST /messages?sessionId=...`.
- **URL pública (Render)**: `https://<tu-servicio>.onrender.com/mcp` o `/sse`
- **Auth por petición**: header `Authorization: Bearer <MCP_AUTH_TOKEN>`.

> **Solo lectura (decisión del propietario, 2026-11-09):** el MCP expone
> únicamente herramientas de consulta. No existen `crear/editar/eliminar`
> desde el MCP; las mutaciones se hacen por la API REST/consola con
> credenciales humanas.

## ¿Cómo funcionan los transportes?

### Streamable HTTP (recomendado)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/mcp` | POST | JSON-RPC directa: la respuesta llega en el mismo cuerpo (modo stateless; cada POST es una sesión efímera). |
| `/mcp` | GET/DELETE | 405 (no se mantienen streams ni sesiones persistentes). |

### Legacy HTTP+SSE

| Ruta | Método | Canal | Descripción |
|------|--------|-------|-------------|
| `/sse` | GET | servidor → agente | Abre el stream SSE. El primer evento (`event: endpoint`) devuelve la URL `POST /messages?sessionId=<id>` que el agente debe usar. |
| `/messages?sessionId=<id>` | POST | agente → servidor | Mensajes JSON-RPC (initialize, tools/list, tools/call). |

Cada conexión `GET /sse` crea una **sesión independiente** (con su propio id)
y todas las rutas MCP exigen autenticación: si `MCP_AUTH_TOKEN` no está
definido, **toda** petición recibe 401 (*fail closed*).

## Variables de entorno

```bash
# Requeridas para el funcionamiento de las herramientas
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # acceso sin RLS desde el MCP

# Secreto compartido de los agentes (generar con: openssl rand -hex 32)
MCP_AUTH_TOKEN=...

# Opcional
PORT=3000
```

En el dashboard de Render, esto se agrega en el servicio → *Environment*.
`SUPABASE_SERVICE_ROLE_KEY` es la que usan las herramientas para hablar con la
base de datos (RLS no aplica), de modo que el agente no depende de un JWT de
usuario que expiraría en ~1 hora.

## Herramientas (tools) — solo lectura

| Tool | Acción | Parámetros |
|------|--------|------------|
| `listar_concesionarios` | lectura | `estado`?, `ciudad`?, `departamento`?, `page`?, `limit`? (máx. 100) |
| `obtener_reportes_2026` | lectura | opcionales: `concesionario_id`, `estado`, `ciudad`, `fecha_desde`, `fecha_hasta` (YYYY-MM-DD). Por defecto cubre **del 2026-01-01 al 2026-12-31** y devuelve aperturas, interacciones CRM y rendimiento por concesionario |

Todas validan con zod en runtime y delegan en los servicios del backend, que
devuelven los mensajes de error de negocio en español.

## Configuración `mcpServers` para agentes

### Cliente con soporte de remote MCP (Claude Desktop / Cursor / genéricos)

Transporte moderno (`POST /mcp`, streamable-http):

```json
{
  "mcpServers": {
    "mundo-motos-crm": {
      "type": "http",
      "url": "https://tu-servicio.onrender.com/mcp",
      "headers": {
        "Authorization": "Bearer TU_MCP_AUTH_TOKEN"
      }
    }
  }
}
```

Transporte legacy (HTTP+SSE), si el cliente no soporta streamable-http:

```json
{
  "mcpServers": {
    "mundo-motos-crm": {
      "type": "sse",
      "url": "https://tu-servicio.onrender.com/sse",
      "headers": {
        "Authorization": "Bearer TU_MCP_AUTH_TOKEN"
      }
    }
  }
}
```

### Cliente que solo habla `stdio` / `streamable-http` (ej. DSH)

Un cliente con `streamable-http` se conecta **directamente** a `POST /mcp`
(sin puente). Solo si el cliente no soporta headers ni streamable-http:

`mcp-remote` levanta un stdio local del lado del agente y aterriza al
transporte remoto, inyectando el header:

```json
{
  "mcpServers": {
    "mundo-motos-crm": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://tu-servicio.onrender.com/sse",
        "--header",
        "Authorization: Bearer ${MCP_AUTH_TOKEN}"
      ],
      "env": {
        "MCP_AUTH_TOKEN": "TU_MCP_AUTH_TOKEN"
      }
    }
  }
}
```

Para un harness de Digibee (o cualquier plataforma cloud) basta con resolver
las dos URLs: `GET https://tu-servicio.onrender.com/sse` (con el header) para
obtener `sessionId`, y `POST /messages?sessionId=...` para hablar JSON-RPC.

## Smoke test con curl

```bash
export MCP_AUTH_TOKEN=tu-secreto
export BASE=https://tu-servicio.onrender.com

# 1) Abrir el canal SSE (queda corriendo; anota el sessionId del evento endpoint)
curl -N -H "Authorization: Bearer $MCP_AUTH_TOKEN" "$BASE/sse"
# event: endpoint
# data: /messages?sessionId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 2) En otra terminal, inicializar la sesión (sustituye <ID>)
curl -X POST "$BASE/messages?sessionId=<ID>" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'

# 3) Confirmar la sesión
curl -X POST "$BASE/messages?sessionId=<ID>" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'

# 4) Listar herramientas
curl -X POST "$BASE/messages?sessionId=<ID>" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 5) Llamar una herramienta (la respuesta viaja por el stream del paso 1)
curl -X POST "$BASE/messages?sessionId=<ID>" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"listar_concesionarios","arguments":{}}}'
```

## Seguridad

- **Fail closed**: sin `MCP_AUTH_TOKEN` no hay acceso MCP (401 para todo).
- **Comparación en tiempo constante** del secreto (`crypto.timingSafeEqual`)
  para evitar ataques de temporización.
- **service_role**: las herramientas bypasean RLS; el token debe tratarse como
  una credencial crítica. Rotala (`MCP_AUTH_TOKEN`) si se filtra: los agentes
  se reconfiguran con el nuevo valor.
- **Solo lectura**: el MCP no ofrece herramientas de mutación (decisión del
  propietario). Los borrados/ediciones se hacen por REST/consola con
  credenciales humanas y quedan trazables.
- HTTPS únicamente (Render lo entrega de serie); sin rate-limit específico
  para MCP (conexiones long-lived en SSE), protege el secreto y monitorea logs.

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `401 No autorizado` en `/sse` o `/mcp` | Falta header o secreto incorrecto | Verifica `Authorization: Bearer <MCP_AUTH_TOKEN>` y que la variable coincida en el servidor |
| `404 Sesión MCP no encontrada` en `POST /messages` | Sesión cerrada o id erróneo | Reabre `GET /sse`, usa el `sessionId` del último evento `endpoint` |
| La conexión se cierra tras ~1-2 min (legacy SSE) | Proxy con timeout idle | El backend envía comentarios SSE cada 15 s (`: ping`); en ese caso usa `POST /mcp` (sin conexión persistente) |
| `initialize` OK pero sin respuesta (legacy SSE) | Respuestas por SSE | Los resultados JSON-RPC llegan por el stream `GET /sse`, no en el cuerpo del POST |
| Tool responde `isError` con mensaje SQL | RIF duplicado, FK inválida, etc. | Edita el argumento según el mensaje devuelto (viene en español) |

## Desarrollo local

```bash
# 1) Configura ./.env (ver .env.example) y agrega:
#    MCP_AUTH_TOKEN=un-secreto-local

# 2) Arranca el backend
npm.cmd run dev --workspace=@mundo-motos/backend

# 3) Conéctate con un cliente MCP local (URL abajo) o usa el curl del smoke test
#    http://localhost:3000/sse
```

El montaje del transporte se hace en `packages/backend/src/index.ts`
(`montarMcpsEnExpress`, antes de `express.json`) y las herramientas viven en
`packages/backend/src/mcp/server.ts`.
