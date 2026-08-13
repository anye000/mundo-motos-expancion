# 🏍️ Mundo Motos CRM - Sistema de Gestión y Geolocalización de Concesionarios

<div align="center">

![Mundo Motos](https://img.shields.io/badge/Mundo-Motos-000000?style=for-the-badge&logo=motorcycle)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**CRM y Dashboard de gestión y geolocalización de concesionarios Mundo Motos**

[Características](#características) • [Instalación](#instalación) • [Uso](#uso) • [Documentación](#documentación) • [Contribuir](#contribuir)

</div>

---

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Tech Stack](#tech-stack)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación](#instalación)
5. [Configuración](#configuración)
6. [Uso](#uso)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Desarrollo](#desarrollo)
9. [Producción](#producción)
10. [Documentación](#documentación)
11. [Troubleshooting](#troubleshooting)
12. [Contribuir](#contribuir)
13. [Licencia](#licencia)

---

## 🎯 Características

### 🏢 Gestión de Concesionarios
- ✅ CRUD completo de concesionarios
- ✅ Información detallada con metadatos flexibles
- ✅ Asignación de gerentes
- ✅ Estados de operación (activo/inactivo)
- ✅ Búsqueda y filtrado avanzado

### 📍 Geolocalización
- ✅ Mapas interactivos con OpenStreetMap/Leaflet
- ✅ Búsqueda de ubicaciones cercanas (radio en km)
- ✅ Cálculo de distancias (Fórmula Haversine)
- ✅ Múltiples ubicaciones por concesionario
- ✅ Clasificación (principal, secundaria, almacén, taller)

### 💼 Sistema CRM
- ✅ Gestión de contactos y leads
- ✅ Pipeline de ventas (4 estados: nuevo → en progreso → calificado → descartado)
- ✅ Asignación de contactos a vendedores
- ✅ Seguimiento de origen (llamada, email, web, referencia)
- ✅ Analytics y métricas en tiempo real
- ✅ Historial de interacciones

### 🛡️ Seguridad
- ✅ Autenticación con JWT
- ✅ Row Level Security (RLS) en base de datos
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Validación de entrada con Zod
- ✅ Rate limiting
- ✅ CORS configurado

### 📱 Progressive Web App (PWA)
- ✅ Capacidades offline con Service Workers
- ✅ Instalable como aplicación nativa
- ✅ Sincronización en segundo plano
- ✅ Soporte para dispositivos móviles

### ⚙️ Arquitectura
- ✅ Monolito Modular escalable
- ✅ Separación en dominios (concesionarios, ubicaciones, CRM)
- ✅ TypeScript en todo el stack
- ✅ Type-safe con interfaces estrictas

---

## 🛠️ Tech Stack

### Frontend
```
React 18+               - UI Framework
TypeScript 5.3+         - Lenguaje tipado
Vite 5.0+              - Build tool y dev server
Tailwind CSS 3.4+       - Utilidades CSS
React Router 6.20+      - Routing
Axios 1.6+             - HTTP client
Zustand 4.4+           - State management
React Leaflet 4.2+      - Mapas
Vite PWA Plugin 0.17+   - Progressive Web App
```

### Backend
```
Node.js 18+            - Runtime
Express 4.18+          - Web framework
TypeScript 5.3+        - Lenguaje tipado
PostgreSQL 15+         - Base de datos
Supabase               - Backend as a Service
Pino 8.17+             - Logging
JWT 9.1+               - Autenticación
Zod 3.22+              - Validación
```

### DevOps & Tools
```
Docker                 - Containerización
Docker Compose         - Orquestación local
npm 10+                - Package manager
Turbo 1.13+            - Monorepo manager
TypeScript             - Type checking
ESLint 8.57+           - Linting
Prettier 3.2+          - Code formatting
Vitest 1.0+            - Testing
```

---

## 📋 Requisitos Previos

### Obligatorios
- **Node.js** >= 18.0.0 ([Descargar](https://nodejs.org/))
- **npm** >= 9.0.0 (incluido con Node.js)
- **Git** ([Descargar](https://git-scm.com/))

### Opcionales pero Recomendados
- **Docker** >= 20.0 y **Docker Compose** >= 2.0 para desarrollo en contenedor
- **Supabase CLI** para gestión de base de datos
- **Postman** o **Insomnia** para testing de API
- **VS Code** con extensiones recomendadas

### Credenciales Requeridas
- Cuenta en [Supabase](https://supabase.com) (gratuita)
- (Opcional) Cuenta en servicios de email para SMTP

---

## 📦 Instalación

### 1. Clonar el Repositorio

```bash
# Con HTTPS
git clone https://github.com/mundomotos/crm-api.git

# O con SSH
git clone git@github.com:mundomotos/crm-api.git

# Entrar al directorio
cd mundo-motos-expancion
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias del workspace completo
npm install

# O instalar dependencias de paquete específico
npm install --workspace=@mundo-motos/frontend
npm install --workspace=@mundo-motos/backend
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar con tus credenciales
nano .env.local
```

**Variables críticas a configurar:**

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Backend
PORT=3000
NODE_ENV=development

# Frontend
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Crear Base de Datos

#### Opción A: Supabase (Recomendado)

```bash
# 1. Ir a https://supabase.com y crear proyecto nuevo
# 2. Copiar URL y ANON_KEY
# 3. Ejecutar SQL inicial:
# - Ir a SQL Editor
# - Ejecutar scripts en docs/base-de-datos.md
```

#### Opción B: PostgreSQL Local

```bash
# Instalar PostgreSQL
# macOS
brew install postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Crear base de datos
createdb mundo_motos_crm
psql mundo_motos_crm < docs/base-de-datos.md
```

---

## ⚙️ Configuración

### Estructura de .env

```env
# ============================================
# SERVIDOR
# ============================================
PORT=3000
HOST=localhost
NODE_ENV=development

# ============================================
# FRONTEND (Vite)
# ============================================
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Mundo Motos CRM

# ============================================
# BASE DE DATOS - Supabase
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key

# ============================================
# MAPAS
# ============================================
VITE_MAP_PROVIDER=openstreetmap
VITE_MAP_CENTER_LAT=4.7110
VITE_MAP_CENTER_LON=-74.0721
VITE_MAP_ZOOM=10
```

Ver [`.env.example`](.env.example) para todas las variables.

### Configurar IDE (VS Code)

#### Extensiones Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "orta.vscode-jest",
    "supabase.supabase"
  ]
}
```

Instalar desde VS Code: `Ctrl+Shift+X` → buscar cada una

#### Configuración Recomendada (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "dist": true
  }
}
```

---

## 🚀 Uso

### Desarrollo Local

#### Opción 1: Ejecutar Todo (Frontend + Backend)

```bash
# Terminal 1: Ejecutar ambos servicios
npm run dev

# Esto ejecutará en paralelo:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
```

#### Opción 2: Ejecutar por Separado

```bash
# Terminal 1: Solo Frontend
npm run dev:frontend

# Terminal 2: Solo Backend
npm run dev:backend
```

#### Opción 3: Con Docker

```bash
# Construir imágenes
docker-compose build

# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Acceder a la Aplicación

```
Frontend:  http://localhost:5173
Backend:   http://localhost:3000
Swagger:   http://localhost:3000/api-docs
Health:    http://localhost:3000/health
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Ejecutar frontend + backend
npm run dev:frontend     # Ejecutar solo frontend
npm run dev:backend      # Ejecutar solo backend

# Build
npm run build            # Build de todo
npm run build:frontend   # Build solo frontend
npm run build:backend    # Build solo backend

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch

# Calidad de Código
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run format           # Prettier (formatear)
npm run format:check     # Prettier (verificar)

# Base de Datos
npm run migrate          # Ejecutar migraciones
npm run seed             # Seed con datos de prueba

# Limpiar
npm run clean            # Limpiar dist y node_modules
```

---

## 📁 Estructura del Proyecto

```
mundo-motos-expancion/
├── 📦 packages/
│   ├── 📁 frontend/
│   │   ├── src/
│   │   │   ├── components/      # Componentes React reutilizables
│   │   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── hooks/           # Custom hooks React
│   │   │   ├── utils/           # Funciones utilidad
│   │   │   ├── types/           # Tipos TypeScript
│   │   │   ├── styles/          # Estilos globales
│   │   │   ├── services/        # Servicios (API, auth)
│   │   │   ├── App.tsx          # Root component
│   │   │   └── main.tsx         # Punto de entrada
│   │   ├── public/              # Archivos estáticos
│   │   ├── index.html
│   │   ├── vite.config.ts       # Configuración Vite
│   │   ├── tailwind.config.js   # Configuración Tailwind
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── 📁 backend/
│       ├── src/
│       │   ├── modules/         # Módulos del monolito
│       │   │   ├── concesionarios/
│       │   │   │   ├── controller.ts
│       │   │   │   ├── service.ts
│       │   │   │   ├── repository.ts
│       │   │   │   └── index.ts
│       │   │   ├── ubicaciones/
│       │   │   │   ├── controller.ts
│       │   │   │   ├── service.ts
│       │   │   │   ├── repository.ts
│       │   │   │   └── index.ts
│       │   │   └── crm/
│       │   │       ├── controller.ts
│       │   │       ├── service.ts
│       │   │       ├── repository.ts
│       │   │       └── index.ts
│       │   ├── middleware/      # Middleware compartido
│       │   ├── config/          # Configuración
│       │   ├── utils/           # Utilidades
│       │   ├── types/           # Tipos globales
│       │   └── index.ts         # Punto de entrada
│       ├── dist/                # Código compilado
│       ├── tsconfig.json
│       └── package.json
│
├── 📚 docs/
│   ├── arquitectura.md          # Documentación de arquitectura
│   ├── base-de-datos.md         # Esquema y scripts SQL
│   ├── api-endpoints.md         # Documentación de API
│   └── README.md                # Guía de desarrollo
│
├── .env.example                 # Plantilla de variables
├── .gitignore
├── package.json                 # Workspace root
├── tsconfig.json
├── README.md                    # Este archivo
└── LICENSE
```

### Flujo de Datos por Módulo

```
Frontend (React)
    ↓
Vite Dev Server (5173)
    ↓
API Client (Axios)
    ↓
Express Server (3000)
    ├─ Middleware (Auth, Validation)
    ├─ Router
    ├─ Controller
    ├─ Service
    └─ Repository
        ↓
    PostgreSQL / Supabase
```

---

## 👨‍💻 Desarrollo

### Crear Nuevo Componente React

```typescript
// src/components/MyComponent.tsx
import { FC } from 'react'

interface MyComponentProps {
  title: string
  onClick?: () => void
}

export const MyComponent: FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <div className="p-4 bg-mm-black text-mm-yellow">
      <h1>{title}</h1>
      <button 
        onClick={onClick}
        className="btn-secondary"
      >
        Click me
      </button>
    </div>
  )
}

export default MyComponent
```

### Crear Nuevo Endpoint

```typescript
// packages/backend/src/modules/ejemplo/controller.ts
import { Router } from 'express'
import { sendSuccess, ApiError } from '@utils/helpers'

export async function getEjemplo(req, res, next) {
  try {
    // Lógica
    sendSuccess(res, { mensaje: 'ok' })
  } catch (error) {
    next(error)
  }
}

export const ejemploRouter = Router()
ejemploRouter.get('/', getEjemplo)

export default ejemploRouter
```

### Integración con Backend

```typescript
// src/services/ejemplo.ts
import { apiService } from '@services/api'

export const ejemploService = {
  getAll: () => apiService.get('/ejemplo'),
  getById: (id: string) => apiService.get(`/ejemplo/${id}`),
  create: (data: any) => apiService.post('/ejemplo', data),
  update: (id: string, data: any) => apiService.put(`/ejemplo/${id}`, data),
  delete: (id: string) => apiService.delete(`/ejemplo/${id}`),
}
```

### Usar en Componente

```typescript
// src/pages/Ejemplo.tsx
import { useState, useEffect } from 'react'
import { ejemploService } from '@services/ejemplo'

export function Ejemplo() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const response = await ejemploService.getAll()
    if (response.success) {
      setData(response.data)
    }
    setLoading(false)
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.nombre}</div>
      ))}
    </div>
  )
}
```

### Testing

```bash
# Ejecutar tests
npm run test

# Ver coverage
npm run test -- --coverage

# Tests en modo watch
npm run test:watch
```

---

## 🏢 Producción

### Build

```bash
# Build completo
npm run build

# Build individual
npm run build:frontend
npm run build:backend
```

### Deployment

#### En Vercel (Frontend)

```bash
# 1. Push a GitHub
git push origin main

# 2. Conectar a Vercel
# https://vercel.com/new

# 3. Configurar:
# - Framework: Vite
# - Root: packages/frontend
# - Build: npm run build:frontend
```

#### En Railway/Render (Backend)

```bash
# 1. Conectar repositorio
# 2. Agregar variables de entorno (.env)
# 3. Deploy automático en push a main
```

#### Con Docker

```bash
# Buildear imagen
docker build -t mundo-motos-crm .

# Ejecutar
docker run -p 3000:3000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_ANON_KEY=... \
  mundo-motos-crm
```

### Monitoreo

```bash
# Health check
curl http://localhost:3000/health

# Logs estructurados (Pino)
npm run dev | grep -i "error\|warning"

# Performance
curl http://localhost:3000/api/metrics
```

---

## 📚 Documentación

Documentación técnica detallada disponible en la carpeta `/docs`:

- **[arquitectura.md](docs/arquitectura.md)**: Explicación de arquitectura, monolito modular, flujos de datos
- **[base-de-datos.md](docs/base-de-datos.md)**: Esquema ER, tablas, índices, RLS, scripts SQL
- **[api-endpoints.md](docs/api-endpoints.md)**: Documentación completa de endpoints, ejemplos cURL

### Generar Documentación

```bash
# Documentación de OpenAPI/Swagger
npm run docs:generate

# Servir documentación
npm run docs:serve
```

---

## 🔧 Troubleshooting

### Puerto 3000 ya en uso

```bash
# Cambiar puerto
PORT=3001 npm run dev:backend

# O encontrar y matar proceso
lsof -i :3000
kill -9 <PID>
```

### Errores de conexión a Supabase

```bash
# Verificar variables de entorno
cat .env.local | grep SUPABASE

# Verificar credenciales en dashboard Supabase
# Probar conexión
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  https://<proyecto>.supabase.co/rest/v1/users
```

### Problemas con node_modules

```bash
# Limpiar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Type check
npm run type-check

# Regenerar tipos (si usas Supabase)
npx supabase gen types typescript --project-id <ID> > types/supabase.ts
```

### Tests fallando

```bash
# Ejecutar con modo verbose
npm run test -- --reporter=verbose

# Tests de módulo específico
npm run test -- ubicaciones
```

---

## 🤝 Contribuir

### Flujo de Trabajo

1. **Fork** el repositorio
2. **Clone** tu fork: `git clone https://github.com/tu-usuario/crm-api.git`
3. **Crea rama**: `git checkout -b feature/mi-feature`
4. **Commit**: `git commit -am 'Add mi-feature'`
5. **Push**: `git push origin feature/mi-feature`
6. **Pull Request**: Abre PR con descripción detallada

### Estándares de Código

```bash
# Antes de hacer commit
npm run type-check    # TypeScript
npm run lint          # ESLint
npm run format        # Prettier

# O automático
npm run lint --fix
npm run format
```

### Convención de Commits

```
feat: Agregar nueva funcionalidad
fix: Corregir bug
docs: Cambios en documentación
style: Cambios de formato (no afecta lógica)
refactor: Refactorización de código
test: Agregar o modificar tests
chore: Cambios de build, dependencias, etc.

Ejemplo:
feat(crm): agregar búsqueda de contactos por email
```

---

## 📄 Licencia

Este proyecto está bajo licencia [MIT](LICENSE).

```
MIT License © 2026 Mundo Motos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 📞 Soporte

### Canales de Contacto

- **Email**: `dev@mundomotos.com`
- **Slack**: `#crm-development`
- **GitHub Issues**: [Reportar Bug](https://github.com/mundomotos/crm-api/issues)
- **Documentación**: [Wiki](https://github.com/mundomotos/crm-api/wiki)

### FAQ

**P: ¿Qué base de datos usa el proyecto?**
R: PostgreSQL alojado en Supabase. También puedes usar PostgreSQL local en desarrollo.

**P: ¿Cómo agrego un nuevo módulo?**
R: Ver [Arquitectura](docs/arquitectura.md#monolito-modular)

**P: ¿Se puede convertir a microservicios?**
R: Sí, la arquitectura de monolito modular está diseñada para facilitar esa transición.

**P: ¿Cuál es el proceso de deploy?**
R: Ver sección [Producción](#producción)

---

## 🎉 Agradecimientos

Proyecto desarrollado con ❤️ para **Mundo Motos**.

Tecnologías principales:
- [React](https://react.dev)
- [Express](https://expressjs.com)
- [TypeScript](https://www.typescriptlang.org)
- [PostgreSQL](https://www.postgresql.org)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)

---

<div align="center">

**[⬆ Volver al Top](#-mundo-motos-crm---sistema-de-gestión-y-geolocalización-de-concesionarios)**

Hecho con 🏍️ para Mundo Motos | [GitHub](https://github.com/mundomotos) | [Web](https://mundomotos.com)

</div>