# 🎯 PRÓXIMOS PASOS DESPUÉS DE INSTALAR

Felicidades! Has creado exitosamente la estructura completa de **Mundo Motos CRM**.

---

## PASO 1: Preparar el Ambiente (2-3 minutos)

### Instalar dependencias
```bash
npm install
```

### Crear archivo .env
```bash
cp .env.example .env.local
```

### Editar .env.local
Agregar tus credenciales de Supabase:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

---

## PASO 2: Configurar Base de Datos (3-5 minutos)

### Opción A: Supabase (RECOMENDADO)
1. Ir a https://supabase.com
2. Crear proyecto nuevo (gratuito)
3. En Settings → API, copiar URL y ANON_KEY
4. Agregar a .env.local
5. En SQL Editor, ejecutar el contenido de `docs/base-de-datos.md` (Script SQL completo)

### Opción B: PostgreSQL Local
1. Instalar PostgreSQL: `brew install postgresql@15`
2. Iniciar: `brew services start postgresql@15`
3. Crear DB: `createdb mundo_motos_crm`
4. Ejecutar SQL: `psql mundo_motos_crm < docs/base-de-datos.md`

---

## PASO 3: Verificar la Instalación

### Health Check
```bash
# Backend debe responder en 3000
curl http://localhost:3000/health

# Response esperado:
# {"status":"ok","timestamp":"2026-02-13T10:30:00Z","environment":"development"}
```

### Iniciar Desarrollo
```bash
npm run dev
```

Deberías ver:
```
✓ Frontend running at http://localhost:5173
✓ Backend running at http://localhost:3000
```

---

## PASO 4: Explorar la Aplicación

### Accesos
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **Health**: http://localhost:3000/health

### Primeras Acciones
1. **Crear usuario inicial** (via SQL)
```sql
INSERT INTO users (email, nombre, apellido, rol)
VALUES ('admin@mundomotos.com', 'Admin', 'Sistema', 'admin');
```

2. **Crear concesionario** (via API)
```bash
curl -X POST http://localhost:3000/api/v1/concesionarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mundo Motos Bogotá",
    "razonSocial": "Mundo Motos S.A.S",
    "nit": "123456789",
    "email": "bogota@mundomotos.com",
    "ciudad": "Bogotá",
    "departamento": "Cundinamarca",
    "direccion": "Cra 7 #120-50",
    "latitud": 4.7110,
    "longitud": -74.0721,
    "gerente": "uuid-del-gerente"
  }'
```

3. **Ver documentación**
   - Leer `docs/api-endpoints.md` para todos los endpoints

---

## 📚 Documentación por Tipo

### Para Arquitectura
→ `docs/arquitectura.md`
- Cómo está organizado el proyecto
- Monolito modular
- Flujo de datos
- Cómo agregar nuevas features

### Para Base de Datos
→ `docs/base-de-datos.md`
- Esquema de tablas
- Cómo funciona RLS
- Scripts de inicialización
- Migración de datos

### Para API
→ `docs/api-endpoints.md`
- Todos los endpoints documentados
- Parámetros y respuestas
- Ejemplos cURL
- Códigos de error

### Para Inicio Rápido
→ `QUICKSTART.md`
- Configuración en 5 minutos
- Primeros pasos
- Comandos esenciales

### Guía Completa
→ `README.md`
- Todo lo que necesitas saber
- Setup, uso, deployment
- Troubleshooting

---

## 🛠️ Comandos Principales

```bash
# Desarrollo
npm run dev              # Frontend + Backend
npm run dev:frontend     # Solo frontend (5173)
npm run dev:backend      # Solo backend (3000)

# Build
npm run build            # Build de producción
npm run build:frontend   # Build React
npm run build:backend    # Build Node.js

# Calidad de Código
npm run type-check       # Validar tipos TS
npm run lint             # ESLint
npm run format           # Prettier (auto-fix)

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Tests en watch mode

# Utilidades
npm run clean            # Limpiar node_modules
npm run migrate          # Migraciones DB
npm run seed             # Datos de prueba
```

---

## 🐳 Alternativa: Docker

Si prefieres no instalar dependencias localmente:

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

Servicios en Docker:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 🎯 Hoja de Ruta de Desarrollo

### Fase 1: Setup (Ya hecho ✅)
- [x] Estructura de carpetas
- [x] Configuración TypeScript
- [x] Dependencias instaladas
- [x] Documentación base

### Fase 2: Implementar Endpoints (Próximo)
- [ ] Autenticación JWT
- [ ] CRUD Concesionarios
- [ ] CRUD Ubicaciones
- [ ] CRUD CRM Contacts

### Fase 3: Frontend (Después)
- [ ] Login page
- [ ] Dashboard
- [ ] Listados de concesionarios
- [ ] Mapa interactivo
- [ ] Formularios CRUD

### Fase 4: Testing
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] E2E testing

### Fase 5: Producción
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] CI/CD pipelines
- [ ] Monitoreo

---

## ⚠️ Common Issues

### Puerto ya en uso
```bash
PORT=3001 npm run dev:backend
```

### Error de conexión Supabase
```bash
# Verificar .env.local
cat .env.local | grep SUPABASE

# Probar manualmente
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/users
```

### node_modules corrupto
```bash
npm run clean
npm install
```

### TypeScript errors
```bash
npm run type-check
```

---

## 📞 Recursos Útiles

- **Documentación oficial**
  - React: https://react.dev
  - Express: https://expressjs.com
  - Supabase: https://supabase.com/docs
  - Tailwind: https://tailwindcss.com/docs

- **Herramientas recomendadas**
  - Postman: API testing
  - VS Code: Editor
  - Git: Control de versiones
  - Docker: Containerización

- **Este proyecto**
  - README.md: Guía completa
  - QUICKSTART.md: Inicio rápido
  - PROYECTO_RESUMEN.md: Lo que se creó
  - docs/: Documentación técnica

---

## 🎉 ¡Listo para Comenzar!

Tu proyecto está configurado y listo para desarrollo.

```bash
# Comienza aquí:
npm install      # Instalar deps
npm run dev      # Ejecutar
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

**Bienvenido a Mundo Motos CRM** 🏍️

---

**¿Preguntas?** Ver `README.md` o documentación en `/docs`
