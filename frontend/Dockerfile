# Etapa 1: Construcción
FROM node:18-alpine AS builder

# Declaramos que necesitamos esta variable para el build
ARG VITE_API_URL
ARG VITE_ADMIN_TOKEN

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Inyectamos las variables justo antes de compilar
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_TOKEN=$VITE_ADMIN_TOKEN

RUN npm run build

# Etapa 2: Servidor de producción (Nginx)
FROM nginx:alpine

# COPIAMOS TU CONFIGURACIÓN PERSONALIZADA
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos de la app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]