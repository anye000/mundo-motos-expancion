# 🚀 Quick Start - Mundo Motos CRM

Guía rápida para comenzar en 5 minutos.

## Paso 1: Clonar y Instalar (2 min)

```bash
# Clonar repositorio
git clone https://github.com/mundomotos/crm-api.git
cd mundo-motos-expancion

# Instalar dependencias
npm install
```

## Paso 2: Configurar Base de Datos (1 min)

### Opción A: Supabase (Recomendado - Más rápido)

```bash
# 1. Ir a https://supabase.com
# 2. Crear proyecto nuevo (gratuito)
# 3. Copiar URL y ANON_KEY desde: Settings → API

# 4. Configurar .env
cp .env.example .env.local

# Editar .env.local con tus credenciales:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key

# 5. Ejecutar SQL inicial en Supabase SQL Editor:
# Copiar contenido de docs/base-de-datos.md (Script SQL)
```

### Opción B: PostgreSQL Local

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Crear base de datos
createdb mundo_motos_crm

# Configurar .env
cp .env.example .env.local
# Actualizar:
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=<tu-password>
```

## Paso 3: Ejecutar en Desarrollo (2 min)

```bash
# Terminal única - Ejecutar frontend + backend
npm run dev

# O dos terminales separadas:
# Terminal 1
npm run dev:frontend    # Puerto 5173

# Terminal 2
npm run dev:backend     # Puerto 3000
```

## Acceder a la Aplicación

```
Frontend:  http://localhost:5173
Backend:   http://localhost:3000
API:       http://localhost:3000/api/v1
Health:    http://localhost:3000/health
```

## Primeros Pasos en la Aplicación

### 1. Crear Usuario (Admin)

```bash
# Mediante SQL en Supabase o PostgreSQL
INSERT INTO users (email, nombre, apellido, rol, estado)
VALUES ('admin@mundomotos.com', 'Admin', 'Sistema', 'admin', 'activo');
```

### 2. Login en la App

```
Email: admin@mundomotos.com
Contraseña: (según tu BD)
```

### 3. Crear Concesionario

Ir a Dashboard → Concesionarios → Nuevo

```
Nombre: Mundo Motos Bogotá
Razón Social: Mundo Motos S.A.S
NIT: 123456789
Email: info@bogota.mundomotos.com
Latitud: 4.7110
Longitud: -74.0721
```

### 4. Ver Mapa

Ir a Mapa → Ver ubicaciones de concesionarios

## Comandos Útiles

```bash
# Development
npm run dev              # Todo (frontend + backend)
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend

# Build para producción
npm run build

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Modo watch

# Calidad de código
npm run type-check       # TypeScript
npm run lint             # ESLint
npm run format           # Prettier

# Limpiar
npm run clean            # Borrar node_modules y dist
```

## Con Docker (Alternativa)

```bash
# Construir
docker-compose build

# Ejecutar
docker-compose up

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| `Puerto 3000 en uso` | `PORT=3001 npm run dev:backend` |
| `Error de conexión Supabase` | Verificar URL y ANON_KEY en .env.local |
| `node_modules corrupto` | `npm run clean && npm install` |
| `TypeScript errors` | `npm run type-check` |

## Documentación Completa

- [README.md](README.md) - Guía completa
- [docs/arquitectura.md](docs/arquitectura.md) - Arquitectura del proyecto
- [docs/base-de-datos.md](docs/base-de-datos.md) - Schema y migraciones
- [docs/api-endpoints.md](docs/api-endpoints.md) - API endpoints

## Siguiente Paso

→ Leer [README.md](README.md) para guía completa
