# 🗄️ Documentación de Base de Datos - Mundo Motos CRM

## 📋 Tabla de Contenidos
1. [Introducción](#introducción)
2. [Esquema ER](#esquema-er)
3. [Tablas y Columnas](#tablas-y-columnas)
4. [Índices](#índices)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Scripts de Inicialización](#scripts-de-inicialización)

---

## Introducción

### Stack Tecnológico
- **Base de Datos**: PostgreSQL 15+
- **Hosting**: Supabase (PostgreSQL como servicio)
- **Tipos de Datos**: UUID, JSONB, ARRAY, ENUM
- **Seguridad**: Row Level Security (RLS) habilitado
- **ORM/Query Builder**: Supabase Client o Raw SQL

### Decisiones Arquitectónicas

| Decisión | Razón |
|----------|--------|
| **UUID como PK** | Mejor para distributed systems, seguridad |
| **JSONB para metadatos** | Flexibilidad sin migrations frecuentes |
| **RLS habilitado** | Seguridad a nivel de fila |
| **Soft deletes** | Auditabilidad y recuperabilidad |
| **Timestamps** | Auditabilidad y ordenamiento |

---

## Esquema ER

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  users (Usuarios)          concesionarios (Concesionarios)    │
│  ├─ id (UUID)              ├─ id (UUID)                        │
│  ├─ email                  ├─ nombre                           │
│  ├─ nombre                 ├─ razon_social                     │
│  ├─ rol                    ├─ nit                              │
│  └─ created_at             ├─ gerente_id (FK → users)         │
│                            ├─ latitud                          │
│                            ├─ longitud                         │
│                            └─ metadatos (JSONB)               │
│                                   │                            │
│                                   │                            │
│                                   └──────────────┐             │
│                                                  │             │
│  ubicaciones (Geolocalización)     crm_contacts │             │
│  ├─ id (UUID)                      ├─ id (UUID) │             │
│  ├─ concesionario_id (FK) ◄────────┤            │             │
│  ├─ nombre                         │            │             │
│  ├─ latitud                        │ asignado_a (FK → users)
│  ├─ longitud                       │            │
│  ├─ tipo (ENUM)                    │            │
│  └─ metadatos (JSONB)              │            │
│                                    │            │
│                          concesionario_id (FK) ─┘
│                                    │
│                           concesionario (FK) ────┐
│                                                  │
│          actividades_crm (Audit Trail)           │
│          ├─ id (UUID)                            │
│          ├─ contact_id (FK)                      │
│          ├─ tipo (llamada|email|reunion|nota)  │
│          ├─ descripcion                         │
│          └─ created_at                          │
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Tablas y Columnas

### 1. Tabla: `users` (Usuarios)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'gerente', 'vendedor', 'operador')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  password_hash VARCHAR(255),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
CREATE INDEX idx_users_estado ON users(estado);
```

**Campos**:
- `id`: Identificador único (UUID v4)
- `email`: Email único del usuario
- `nombre`, `apellido`: Información personal
- `rol`: admin|gerente|vendedor|operador (control de permisos)
- `estado`: activo|inactivo
- `password_hash`: Hash bcrypt de la contraseña
- `ultimo_login`: Timestamp del último login
- `created_at`, `updated_at`: Auditoría
- `deleted_at`: Soft delete para auditabilidad

---

### 2. Tabla: `concesionarios` (Concesionarios Mundo Motos)

```sql
CREATE TABLE concesionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  nit VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  ciudad VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  direccion TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  gerente_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  metadatos JSONB DEFAULT '{}', -- Datos flexibles: horarios, servicios, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_concesionarios_gerente_id ON concesionarios(gerente_id);
CREATE INDEX idx_concesionarios_nit ON concesionarios(nit);
CREATE INDEX idx_concesionarios_estado ON concesionarios(estado);
CREATE INDEX idx_concesionarios_ciudad ON concesionarios(ciudad);
CREATE INDEX idx_concesionarios_geom ON concesionarios USING GIST(
  ll_to_earth(latitud, longitud)
); -- Índice geométrico para búsquedas de proximidad
```

**Campos Clave**:
- `latitud`, `longitud`: Coordenadas para mapas
- `metadatos`: JSONB para datos flexibles como:
  ```json
  {
    "horarios": {"lunes": "8:00-18:00", "sabado": "9:00-14:00"},
    "servicios": ["venta", "mantenimiento", "repuestos"],
    "capacidad_inventario": 150,
    "vehiculos_en_stock": [...]
  }
  ```

---

### 3. Tabla: `ubicaciones` (Geolocalización)

```sql
CREATE TABLE ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario_id UUID NOT NULL REFERENCES concesionarios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  direccion TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'principal'
    CHECK (tipo IN ('principal', 'secundaria', 'almacen', 'taller')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  metadatos JSONB DEFAULT '{}', -- Datos flexibles por ubicación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ubicaciones_concesionario_id ON ubicaciones(concesionario_id);
CREATE INDEX idx_ubicaciones_tipo ON ubicaciones(tipo);
CREATE INDEX idx_ubicaciones_estado ON ubicaciones(estado);
CREATE INDEX idx_ubicaciones_geom ON ubicaciones USING GIST(
  ll_to_earth(latitud, longitud)
);
```

**Uso de metadatos**:
```json
{
  "horario": {"abierto": true, "horaApertura": "08:00", "horaCierre": "18:00"},
  "responsable": {"nombre": "Juan", "telefono": "3001234567"},
  "capacidad_visitantes": 50,
  "servicios_disponibles": ["espera", "cafeteria", "parking"]
}
```

---

### 4. Tabla: `crm_contacts` (Contactos y Leads)

```sql
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(20),
  empresa VARCHAR(255),
  origen VARCHAR(50) NOT NULL
    CHECK (origen IN ('llamada', 'email', 'web', 'referencia', 'otro')),
  estado VARCHAR(50) NOT NULL DEFAULT 'nuevo'
    CHECK (estado IN ('nuevo', 'en_progreso', 'calificado', 'descartado')),
  concesionario_id UUID NOT NULL REFERENCES concesionarios(id) ON DELETE CASCADE,
  asignado_a UUID REFERENCES users(id) ON DELETE SET NULL,
  metadatos JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_crm_contacts_concesionario_id ON crm_contacts(concesionario_id);
CREATE INDEX idx_crm_contacts_asignado_a ON crm_contacts(asignado_a);
CREATE INDEX idx_crm_contacts_estado ON crm_contacts(estado);
CREATE INDEX idx_crm_contacts_origen ON crm_contacts(origen);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
```

**Metadatos de ejemplo**:
```json
{
  "valor_oportunidad": 5000000,
  "probabilidad_cierre": 65,
  "proxima_accion": "enviar propuesta",
  "fecha_proxima_accion": "2026-02-15",
  "historial_interacciones": [
    {
      "fecha": "2026-02-10T14:30:00Z",
      "tipo": "llamada",
      "duracion_minutos": 15,
      "notas": "Mostró interés en modelo XYZ"
    }
  ],
  "productos_interes": ["motocicleta_sport", "accesorio_casco"]
}
```

---

### 5. Tabla: `actividades_crm` (Audit Trail)

```sql
CREATE TABLE actividades_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES users(id),
  tipo VARCHAR(50) NOT NULL
    CHECK (tipo IN ('llamada', 'email', 'reunion', 'nota', 'cambio_estado', 'otro')),
  descripcion TEXT,
  duracion_minutos INTEGER,
  resultado VARCHAR(100),
  proxima_fecha_seguimiento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actividades_crm_contact_id ON actividades_crm(contact_id);
CREATE INDEX idx_actividades_crm_usuario_id ON actividades_crm(usuario_id);
CREATE INDEX idx_actividades_crm_tipo ON actividades_crm(tipo);
```

---

## Índices

### Estrategia de Indexación

| Tabla | Índice | Razón |
|-------|--------|--------|
| users | email | Búsquedas por login |
| users | rol | Filtrados por perfil |
| concesionarios | nit | Búsqueda única |
| concesionarios | gerente_id | Filtrados por gerente |
| concesionarios | geom (GIST) | Proximidad geográfica |
| ubicaciones | concesionario_id | Listado por concesionario |
| ubicaciones | geom (GIST) | Búsqueda de ubicaciones cercanas |
| crm_contacts | estado | Pipeline CRM |
| crm_contacts | concesionario_id | Filtrado |
| crm_contacts | asignado_a | Mis contactos |

---

## Row Level Security (RLS)

### Políticas de Seguridad

#### 1. Usuarios solo ven sus datos
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver propio usuario"
  ON users FOR SELECT
  USING (auth.uid()::uuid = id OR 
         (SELECT rol FROM users WHERE id = auth.uid()::uuid) = 'admin');
```

#### 2. Gerentes ven solo sus concesionarios
```sql
ALTER TABLE concesionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerente ve sus concesionarios"
  ON concesionarios FOR SELECT
  USING (
    gerente_id = auth.uid()::uuid OR
    (SELECT rol FROM users WHERE id = auth.uid()::uuid) = 'admin'
  );
```

#### 3. Contactos por concesionario asignado
```sql
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedor ve contactos asignados"
  ON crm_contacts FOR SELECT
  USING (
    asignado_a = auth.uid()::uuid OR
    gerente_id = auth.uid()::uuid OR
    (SELECT rol FROM users WHERE id = auth.uid()::uuid) = 'admin'
  );
```

---

## Scripts de Inicialización

### Script 1: Crear todas las tablas

```sql
-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance";
CREATE EXTENSION IF NOT EXISTS "cube";

-- Crear usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'operador' CHECK (rol IN ('admin', 'gerente', 'vendedor', 'operador')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  password_hash VARCHAR(255),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Crear concesionarios
CREATE TABLE concesionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  nit VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  ciudad VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  direccion TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  gerente_id UUID REFERENCES users(id) ON DELETE SET NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  metadatos JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Crear ubicaciones
CREATE TABLE ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario_id UUID NOT NULL REFERENCES concesionarios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  direccion TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'principal' CHECK (tipo IN ('principal', 'secundaria', 'almacen', 'taller')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  metadatos JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Crear contactos CRM
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(20),
  empresa VARCHAR(255),
  origen VARCHAR(50) NOT NULL CHECK (origen IN ('llamada', 'email', 'web', 'referencia', 'otro')),
  estado VARCHAR(50) NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'en_progreso', 'calificado', 'descartado')),
  concesionario_id UUID NOT NULL REFERENCES concesionarios(id) ON DELETE CASCADE,
  asignado_a UUID REFERENCES users(id) ON DELETE SET NULL,
  metadatos JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Crear actividades CRM
CREATE TABLE actividades_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES users(id),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('llamada', 'email', 'reunion', 'nota', 'cambio_estado', 'otro')),
  descripcion TEXT,
  duracion_minutos INTEGER,
  resultado VARCHAR(100),
  proxima_fecha_seguimiento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
CREATE INDEX idx_users_estado ON users(estado);

CREATE INDEX idx_concesionarios_gerente_id ON concesionarios(gerente_id);
CREATE INDEX idx_concesionarios_nit ON concesionarios(nit);
CREATE INDEX idx_concesionarios_estado ON concesionarios(estado);
CREATE INDEX idx_concesionarios_ciudad ON concesionarios(ciudad);

CREATE INDEX idx_ubicaciones_concesionario_id ON ubicaciones(concesionario_id);
CREATE INDEX idx_ubicaciones_tipo ON ubicaciones(tipo);
CREATE INDEX idx_ubicaciones_estado ON ubicaciones(estado);

CREATE INDEX idx_crm_contacts_concesionario_id ON crm_contacts(concesionario_id);
CREATE INDEX idx_crm_contacts_asignado_a ON crm_contacts(asignado_a);
CREATE INDEX idx_crm_contacts_estado ON crm_contacts(estado);
CREATE INDEX idx_crm_contacts_origen ON crm_contacts(origen);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);

CREATE INDEX idx_actividades_crm_contact_id ON actividades_crm(contact_id);
CREATE INDEX idx_actividades_crm_usuario_id ON actividades_crm(usuario_id);
CREATE INDEX idx_actividades_crm_tipo ON actividades_crm(tipo);
```

### Script 2: Habilitar RLS (Supabase)

En Supabase, habilitar RLS desde la UI o ejecutar:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE concesionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_crm ENABLE ROW LEVEL SECURITY;
```

### Script 3: Insertar datos de prueba

```sql
-- Insertar usuario admin
INSERT INTO users (email, nombre, apellido, rol, estado)
VALUES ('admin@mundomotos.com', 'Admin', 'Sistema', 'admin', 'activo');

-- Insertar gerentes
INSERT INTO users (email, nombre, apellido, rol, estado)
VALUES 
  ('gerente1@mundomotos.com', 'Carlos', 'García', 'gerente', 'activo'),
  ('gerente2@mundomotos.com', 'María', 'López', 'gerente', 'activo');

-- Insertar concesionarios
INSERT INTO concesionarios (nombre, razon_social, nit, email, ciudad, departamento, direccion, latitud, longitud, gerente_id, estado)
SELECT 'Mundo Motos Bogotá', 'Mundo Motos S.A.S', '123456789', 'info@bogota.mundomotos.com', 
       'Bogotá', 'Cundinamarca', 'Cra 7 #120-50', 4.7110, -74.0721, id, 'activo'
FROM users WHERE email = 'gerente1@mundomotos.com' LIMIT 1;
```

---

## Migración desde otra base de datos

```bash
# Exportar datos existentes
pg_dump -h origin-host -U user -d database --data-only > backup.sql

# Importar en Supabase
psql -h supabase-host -U postgres -d postgres -f backup.sql
```

---

## Monitoreo y Mantenimiento

### Consultas útiles

```sql
-- Tamaño de tablas
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Índices no utilizados
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
AND indexname NOT IN (SELECT constraint_name FROM information_schema.table_constraints)
ORDER BY tablename, indexname;

-- Registros borrados lógicamente
SELECT 'users' as tabla, COUNT(*) FROM users WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'concesionarios', COUNT(*) FROM concesionarios WHERE deleted_at IS NOT NULL;
```

---

## Referencias

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [UUID vs SERIAL](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [JSONB en PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
