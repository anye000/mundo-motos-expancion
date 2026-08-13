# 🏗️ Arquitectura del Proyecto - Mundo Motos CRM

## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Arquitectura General](#arquitectura-general)
3. [Monolito Modular](#monolito-modular)
4. [Flujo de Datos](#flujo-de-datos)
5. [Patrones y Prácticas](#patrones-y-prácticas)
6. [Escalabilidad](#escalabilidad)

---

## Visión General

**Mundo Motos CRM** es un sistema integrado de gestión y geolocalización de concesionarios construido con una arquitectura de **Monolito Modular** (Modular Monolith). Esta arquitectura combina la simplicidad de un monolito con la flexibilidad y organización de un enfoque modular.

### Características Arquitectónicas
- ✅ **Monolito Modular**: Un único proceso de ejecución pero dividido en módulos independientes
- ✅ **Domain-Driven Design (DDD)**: Cada módulo representa un dominio de negocio específico
- ✅ **Fácil escalabilidad**: Posibilidad de evolucionar a microservicios sin refactorización mayor
- ✅ **TypeScript**: Type-safety en todo el stack
- ✅ **Offline-First**: Progressive Web App (PWA) con capacidades offline

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cliente (Navegador)                       │
│                  React 18 + TypeScript + Vite                    │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                      API Gateway (Express)                        │
│              Autenticación | Rate Limiting | CORS                 │
└────────────────────────────┬──────────────────────────────────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────┐       ┌─────────────┐
│Concesionarios│      │Ubicaciones  │       │   CRM       │
│  Module     │      │  Module     │       │  Module     │
└─────────────┘      └─────────────┘       └─────────────┘
    │                    │                      │
    └────────────────────┼──────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   PostgreSQL/Supabase   │
            │    (Base de Datos)      │
            └────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │  Tables  │         │   RLS    │
        │  (UUIDs) │         │ Policies │
        └──────────┘         └──────────┘
```

---

## Monolito Modular

### Estructura de Módulos

```
packages/backend/src/
├── modules/
│   ├── concesionarios/          # Módulo de Concesionarios
│   │   ├── controller.ts         # Controladores (handlers)
│   │   ├── service.ts            # Lógica de negocio
│   │   ├── repository.ts         # Acceso a datos
│   │   ├── types.ts              # DTOs y tipos
│   │   └── index.ts              # Exportaciones públicas
│   │
│   ├── ubicaciones/              # Módulo de Ubicaciones (Geolocalización)
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── crm/                      # Módulo de CRM (Contactos y Leads)
│       ├── controller.ts
│       ├── service.ts
│       ├── repository.ts
│       ├── types.ts
│       └── index.ts
│
├── middleware/                   # Middleware compartido
│   ├── auth.ts                   # Autenticación
│   ├── errorHandler.ts           # Manejo de errores
│   └── validation.ts             # Validación de entrada
│
├── config/                       # Configuración
│   ├── database.ts               # Conexión a BD
│   ├── env.ts                    # Variables de entorno
│   └── logger.ts                 # Logging
│
├── utils/                        # Utilidades compartidas
│   ├── helpers.ts                # Funciones helper
│   └── decorators.ts             # Decoradores TypeScript
│
├── types/                        # Tipos globales
│   └── index.ts                  # Interfaces compartidas
│
└── index.ts                      # Punto de entrada
```

### Responsabilidades por Capas

#### 1. **Controller Layer** (API Endpoints)
```typescript
// packages/backend/src/modules/concesionarios/controller.ts
- Maneja requests HTTP
- Valida entrada
- Llama a servicios
- Retorna respuestas formateadas
```

#### 2. **Service Layer** (Lógica de Negocio)
```typescript
// packages/backend/src/modules/concesionarios/service.ts
- Lógica de negocio compleja
- Validaciones de reglas de negocio
- Coordinación entre repositorios
- Transacciones
```

#### 3. **Repository Layer** (Acceso a Datos)
```typescript
// packages/backend/src/modules/concesionarios/repository.ts
- Queries SQL/Supabase
- CRUD operations
- Queries complejas
- Caché (si aplica)
```

#### 4. **Types Layer** (Contratos)
```typescript
// packages/backend/src/modules/concesionarios/types.ts
- DTOs (Data Transfer Objects)
- Interfaces públicas
- Enums de dominio
```

---

## Flujo de Datos

### Flujo de un Request End-to-End

```
1. Request HTTP
   ↓
2. Express Router → Identifica módulo
   ↓
3. Middleware (Auth, Validation)
   ↓
4. Controller
   ├─ Valida input
   ├─ Llama Service
   └─ Retorna respuesta
   ↓
5. Service
   ├─ Aplica lógica de negocio
   ├─ Valida reglas
   └─ Llama Repository
   ↓
6. Repository
   ├─ Construye query
   ├─ Ejecuta en PostgreSQL
   └─ Retorna datos
   ↓
7. Respuesta formateada → Cliente
```

### Ejemplo: Crear Concesionario

```typescript
// 1. Frontend (React)
const response = await apiService.post('/concesionarios', {
  nombre: 'Concesionario X',
  // ... datos
})

// 2. Backend - Controller
app.post('/api/v1/concesionarios', async (req, res) => {
  const data = req.body // Validación aquí
  const result = await concesionarioService.create(data)
  res.json({ success: true, data: result })
})

// 3. Backend - Service
async create(data: CreateConcesionarioDTO): Promise<Concesionario> {
  // Lógica de negocio
  this.validarNIT(data.nit)
  const concesionario = new Concesionario(data)
  return this.repository.save(concesionario)
}

// 4. Backend - Repository
async save(concesionario: Concesionario): Promise<Concesionario> {
  const { data, error } = await supabase
    .from('concesionarios')
    .insert([concesionario])
    .select()
  
  if (error) throw error
  return data[0]
}

// 5. Database - PostgreSQL
INSERT INTO concesionarios (id, nombre, ...) VALUES (...);
RETURNING *;

// 6. Respuesta al cliente
{
  success: true,
  data: { id: "uuid", nombre: "Concesionario X", ... }
}
```

---

## Patrones y Prácticas

### 1. Dependency Injection
```typescript
// Service recibe dependencias via constructor
class ConcesionarioService {
  constructor(
    private repository: ConcesionarioRepository,
    private logger: Logger
  ) {}
}
```

### 2. Error Handling Centralizado
```typescript
// ApiError custom
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
  }
}

// Middleware de error
app.use((err: ApiError, req, res, next) => {
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    code: err.code
  })
})
```

### 3. Validación con Zod
```typescript
// Schema validation
const CreateConcesionarioSchema = z.object({
  nombre: z.string().min(3),
  email: z.string().email(),
  // ...
})

// En controller
const data = CreateConcesionarioSchema.parse(req.body)
```

### 4. Logging Estructurado
```typescript
// Usar Pino para logging JSON
logger.info({ 
  action: 'create_concesionario',
  userId: req.user.id,
  concesionarioId: result.id
})
```

---

## Escalabilidad

### De Monolito a Microservicios

Si el proyecto crece, cada módulo puede convertirse en microservicio:

```
Fase 1: Monolito Modular (Actual)
├── /modules/concesionarios
├── /modules/ubicaciones
└── /modules/crm

Fase 2: Microservicios Independientes
├── ms-concesionarios (Express)
├── ms-ubicaciones (Express)
└── ms-crm (Express)

Fase 3: Event-Driven Architecture
├── Kafka/RabbitMQ para comunicación
├── API Gateway (Kong/AWS API Gateway)
└── Database per service
```

### Estrategia de Escalado

1. **Vertical Scaling**: Aumentar recursos del servidor
2. **Horizontal Scaling**: Múltiples instancias con load balancer
3. **Database Scaling**: Read replicas, sharding por concesionario
4. **Caching**: Redis para datos calientes

```typescript
// Ejemplo: Usar Redis para caché
const cachedConcesionario = await redis.get(`concesionario:${id}`)
if (cachedConcesionario) return JSON.parse(cachedConcesionario)

const concesionario = await repository.findById(id)
await redis.set(`concesionario:${id}`, JSON.stringify(concesionario), 'EX', 3600)
return concesionario
```

---

## Ventajas de esta Arquitectura

| Ventaja | Descripción |
|---------|------------|
| **Claridad** | Módulos bien definidos y responsabilidades claras |
| **Testabilidad** | Fácil de testear cada módulo de forma aislada |
| **Mantenibilidad** | Código organizado y fácil de entender |
| **Escalabilidad** | Preparado para crecer sin refactorización mayor |
| **Reusabilidad** | Código compartido entre módulos |
| **Flexibilidad** | Cambiar implementación sin afectar otros módulos |

---

## Referencias

- [Modular Monolith](https://www.milanjovanovic.tech/blog/modular-monolith-architecture-in-dotnet)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
