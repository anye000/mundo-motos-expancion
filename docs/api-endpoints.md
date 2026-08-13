# 🔌 Documentación de API Endpoints - Mundo Motos CRM

## 📋 Tabla de Contenidos
1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Endpoints de Concesionarios](#endpoints-de-concesionarios)
4. [Endpoints de Ubicaciones](#endpoints-de-ubicaciones)
5. [Endpoints de CRM](#endpoints-de-crm)
6. [Códigos de Estado](#códigos-de-estado)
7. [Ejemplos cURL](#ejemplos-curl)

---

## Introducción

### Base URL
```
Development:  http://localhost:3000/api/v1
Production:   https://api.mundomotos.com/api/v1
```

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
Accept: application/json
```

### Formato de Respuesta
```json
{
  "success": true,
  "data": { /* datos */ },
  "message": "Operación exitosa"
}
```

---

## Autenticación

### POST `/auth/login`
Autenticar usuario y obtener JWT token.

**Request:**
```json
{
  "email": "usuario@mundomotos.com",
  "password": "contraseña"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@mundomotos.com",
      "nombre": "Carlos",
      "apellido": "García",
      "rol": "gerente"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  },
  "message": "Login exitoso"
}
```

**Errores:**
- `401`: Credenciales inválidas
- `404`: Usuario no encontrado

---

## Endpoints de Concesionarios

### GET `/concesionarios`
Obtener lista de concesionarios con paginación.

**Query Parameters:**
```
?page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nombre": "Mundo Motos Bogotá",
        "razonSocial": "Mundo Motos S.A.S",
        "nit": "123456789",
        "email": "info@bogota.mundomotos.com",
        "telefono": "3001234567",
        "ciudad": "Bogotá",
        "departamento": "Cundinamarca",
        "direccion": "Cra 7 #120-50",
        "latitud": 4.7110,
        "longitud": -74.0721,
        "gerente": "550e8400-e29b-41d4-a716-446655440001",
        "estado": "activo",
        "metadatos": {
          "horarios": {"lunes": "8:00-18:00"},
          "servicios": ["venta", "mantenimiento"]
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-02-10T14:30:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

---

### GET `/concesionarios/:id`
Obtener detalles de un concesionario específico.

**Parameters:**
- `id` (path): UUID del concesionario

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Mundo Motos Bogotá",
    // ... resto de campos
  }
}
```

**Errores:**
- `404`: Concesionario no encontrado

---

### POST `/concesionarios`
Crear nuevo concesionario.

**Request Body:**
```json
{
  "nombre": "Mundo Motos Medellín",
  "razonSocial": "Mundo Motos S.A.S",
  "nit": "987654321",
  "email": "info@medellin.mundomotos.com",
  "telefono": "3104567890",
  "ciudad": "Medellín",
  "departamento": "Antioquia",
  "direccion": "Cra 50 #88-50",
  "latitud": 6.2442,
  "longitud": -75.5898,
  "gerente": "550e8400-e29b-41d4-a716-446655440001",
  "metadatos": {
    "horarios": {"lunes": "8:00-18:00", "sabado": "9:00-14:00"},
    "servicios": ["venta", "mantenimiento", "repuestos"]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    // ... campos completos
  },
  "message": "Concesionario creado exitosamente"
}
```

**Validaciones:**
- `nombre`: Requerido, mínimo 3 caracteres
- `nit`: Único, requerido
- `email`: Formato válido
- `latitud`: Entre -90 y 90
- `longitud`: Entre -180 y 180

---

### PUT `/concesionarios/:id`
Actualizar concesionario.

**Request Body:**
```json
{
  "nombre": "Mundo Motos Medellín (Actualizado)",
  "telefono": "3104567891",
  "metadatos": {
    "horarios": {"lunes": "8:00-20:00"},
    "servicios": ["venta", "mantenimiento", "repuestos", "accesorios"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* concesionario actualizado */ },
  "message": "Concesionario actualizado"
}
```

---

### DELETE `/concesionarios/:id`
Eliminar concesionario (soft delete).

**Response (200):**
```json
{
  "success": true,
  "data": { /* concesionario eliminado */ },
  "message": "Concesionario eliminado"
}
```

---

## Endpoints de Ubicaciones

### GET `/ubicaciones`
Obtener todas las ubicaciones.

**Query Parameters:**
```
?page=1&limit=10&concesionarioId=550e8400-e29b-41d4-a716-446655440000&tipo=principal
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440003",
        "concesionarioId": "550e8400-e29b-41d4-a716-446655440000",
        "nombre": "Showroom Principal",
        "latitud": 4.7110,
        "longitud": -74.0721,
        "direccion": "Cra 7 #120-50, Bogotá",
        "tipo": "principal",
        "estado": "activo",
        "metadatos": {},
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "hasMore": false
  }
}
```

---

### GET `/ubicaciones/geo/cercanas`
Obtener ubicaciones cercanas a una coordenada.

**Query Parameters:**
```
?latitud=4.7110&longitud=-74.0721&radio=10
```
- `latitud` (required): Latitude (-90 a 90)
- `longitud` (required): Longitude (-180 a 180)
- `radio` (optional): Radio en km (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "nombre": "Showroom Principal",
      "latitud": 4.7110,
      "longitud": -74.0721,
      "distancia_km": 0,
      // ... resto de campos
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "nombre": "Taller Especializado",
      "latitud": 4.7150,
      "longitud": -74.0650,
      "distancia_km": 5.2,
      // ... resto de campos
    }
  ]
}
```

---

### GET `/ubicaciones/:id`
Obtener detalles de una ubicación.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    // ... campos completos
  }
}
```

---

### POST `/ubicaciones`
Crear nueva ubicación.

**Request Body:**
```json
{
  "concesionarioId": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Almacén Sur",
  "latitud": 4.6900,
  "longitud": -74.0900,
  "direccion": "Cra 25 #86-50, Bogotá",
  "tipo": "almacen",
  "metadatos": {
    "responsable": {"nombre": "Pedro", "telefono": "3001111111"},
    "capacidad_m2": 500
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* ubicación creada */ },
  "message": "Ubicación creada exitosamente"
}
```

---

### PUT `/ubicaciones/:id`
Actualizar ubicación.

**Response (200):**
```json
{
  "success": true,
  "data": { /* ubicación actualizada */ },
  "message": "Ubicación actualizada"
}
```

---

### DELETE `/ubicaciones/:id`
Eliminar ubicación.

**Response (200):**
```json
{
  "success": true,
  "data": { /* ubicación eliminada */ },
  "message": "Ubicación eliminada"
}
```

---

## Endpoints de CRM

### GET `/crm/contacts`
Obtener contactos con filtros.

**Query Parameters:**
```
?page=1&limit=10&estado=en_progreso&concesionarioId=...&asignadoA=...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440005",
        "nombre": "Juan Pérez",
        "email": "juan@example.com",
        "telefono": "3109876543",
        "empresa": "Transportes XYZ",
        "origen": "web",
        "estado": "en_progreso",
        "concesionarioId": "550e8400-e29b-41d4-a716-446655440000",
        "asignadoA": "550e8400-e29b-41d4-a716-446655440001",
        "metadatos": {
          "valor_oportunidad": 3000000,
          "probabilidad_cierre": 65
        },
        "createdAt": "2024-02-01T09:30:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

---

### GET `/crm/contacts/:id`
Obtener detalles de un contacto.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    // ... campos completos
  }
}
```

---

### POST `/crm/contacts`
Crear nuevo contacto/lead.

**Request Body:**
```json
{
  "nombre": "María García",
  "email": "maria@example.com",
  "telefono": "3112345678",
  "empresa": "Logística Plus",
  "origen": "llamada",
  "concesionarioId": "550e8400-e29b-41d4-a716-446655440000",
  "asignadoA": "550e8400-e29b-41d4-a716-446655440001",
  "metadatos": {
    "valor_oportunidad": 5000000,
    "productos_interes": ["motocicleta_cargo", "servicio_mantenimiento"]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* contacto creado */ },
  "message": "Contacto creado exitosamente"
}
```

---

### PUT `/crm/contacts/:id`
Actualizar contacto.

**Request Body:**
```json
{
  "nombre": "María García López",
  "telefono": "3112345679",
  "metadatos": {
    "valor_oportunidad": 6000000,
    "probabilidad_cierre": 80
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* contacto actualizado */ },
  "message": "Contacto actualizado"
}
```

---

### PUT `/crm/contacts/:id/estado`
Cambiar estado del contacto en el pipeline.

**Request Body:**
```json
{
  "estado": "calificado"
}
```

**Estados válidos:**
- `nuevo`: Contacto nuevo/lead inicial
- `en_progreso`: Se está trabajando en el lead
- `calificado`: Lead calificado, listo para propuesta
- `descartado`: Lead descartado

**Response (200):**
```json
{
  "success": true,
  "data": { /* contacto con estado actualizado */ },
  "message": "Estado del contacto actualizado a \"calificado\""
}
```

---

### DELETE `/crm/contacts/:id`
Eliminar contacto.

**Response (200):**
```json
{
  "success": true,
  "data": { /* contacto eliminado */ },
  "message": "Contacto eliminado"
}
```

---

### GET `/crm/analytics`
Obtener métricas y analytics del CRM.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalContactos": 127,
    "porEstado": {
      "nuevo": 45,
      "en_progreso": 52,
      "calificado": 25,
      "descartado": 5
    },
    "porOrigen": {
      "llamada": 32,
      "email": 28,
      "web": 45,
      "referencia": 18,
      "otro": 4
    },
    "tazaConversion": "19.69"
  }
}
```

---

## Códigos de Estado

| Código | Significado | Descripción |
|--------|------------|------------|
| `200` | OK | Operación exitosa |
| `201` | Created | Recurso creado exitosamente |
| `204` | No Content | Operación exitosa sin contenido |
| `400` | Bad Request | Datos inválidos o malformados |
| `401` | Unauthorized | Token inválido o expirado |
| `403` | Forbidden | Permiso denegado |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (ej: NIT duplicado) |
| `422` | Unprocessable Entity | Validación fallida |
| `500` | Internal Server Error | Error del servidor |

---

## Ejemplos cURL

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@mundomotos.com",
    "password": "contraseña"
  }'
```

### Obtener Concesionarios
```bash
curl -X GET "http://localhost:3000/api/v1/concesionarios?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

### Crear Concesionario
```bash
curl -X POST http://localhost:3000/api/v1/concesionarios \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mundo Motos Cali",
    "razonSocial": "Mundo Motos S.A.S",
    "nit": "555666777",
    "email": "cali@mundomotos.com",
    "ciudad": "Cali",
    "departamento": "Valle del Cauca",
    "direccion": "Av Blt #50-100",
    "latitud": 3.4372,
    "longitud": -76.5069,
    "gerente": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

### Buscar Ubicaciones Cercanas
```bash
curl -X GET "http://localhost:3000/api/v1/ubicaciones/geo/cercanas?latitud=4.7110&longitud=-74.0721&radio=10" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

### Crear Contacto CRM
```bash
curl -X POST http://localhost:3000/api/v1/crm/contacts \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Roberto Flores",
    "email": "roberto@example.com",
    "telefono": "3117654321",
    "empresa": "Transportes del Sur",
    "origen": "web",
    "concesionarioId": "550e8400-e29b-41d4-a716-446655440000",
    "asignadoA": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

### Actualizar Estado de Contacto
```bash
curl -X PUT "http://localhost:3000/api/v1/crm/contacts/990e8400-e29b-41d4-a716-446655440005/estado" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "calificado"
  }'
```

### Obtener Analytics
```bash
curl -X GET http://localhost:3000/api/v1/crm/analytics \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

---

## Rate Limiting

La API implementa rate limiting para proteger contra abuso:

- **Límite**: 100 solicitudes por 15 minutos por IP
- **Headers de respuesta**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1708956300
  ```

---

## Versionamiento de API

La API usa versionamiento en la URL:
- `v1`: Versión actual (estable)
- `v2`: Próxima versión (en desarrollo)

Las versiones se mantendrán por al menos 12 meses antes de deprecarse.

---

## Documentación Interactiva

Para explorar la API interactivamente:
- Postman Collection: `docs/postman-collection.json`
- Swagger UI: `http://localhost:3000/api-docs`
- ReDoc: `http://localhost:3000/redoc`

---

## Soporte

Para dudas o reportes de bugs:
- Email: `api-support@mundomotos.com`
- GitHub Issues: `https://github.com/mundomotos/crm-api/issues`
- Slack: `#api-support`
