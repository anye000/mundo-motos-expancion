# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos raíz
COPY package.json package-lock.json ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY packages/frontend/ packages/frontend/
COPY tsconfig.json ./

# Build frontend
RUN npm run build:frontend

# Production stage - Servir con Nginx
FROM nginx:alpine

COPY packages/frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
