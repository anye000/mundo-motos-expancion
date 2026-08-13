# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos raíz
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY packages/backend/ packages/backend/
COPY packages/frontend/ packages/frontend/
COPY tsconfig.json ./

# Build backend
RUN npm run build:backend

# Production stage
FROM node:18-alpine

WORKDIR /app

# Instalar solo dependencias de producción
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/

RUN npm ci --only=production

# Copiar código compilado desde builder
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

EXPOSE 3000

CMD ["node", "packages/backend/dist/index.js"]
