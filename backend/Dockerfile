# Paso 1: Constructor (Build)
FROM golang:1.24-alpine AS builder
WORKDIR /app

# Instalamos certificados para conexiones HTTPS externas
RUN apk --no-cache add ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compilamos binario estático (sin dependencias de C)
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/main.go

# Paso 2: Producción (Runtime - Mejora B: Seguridad Máxima)
# Distroless no tiene terminal, ni gestor de paquetes, ni vulnerabilidades de SO comunes
FROM gcr.io/distroless/static-debian12:latest
WORKDIR /

# Copiamos certificados y el binario
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/main .

# Corremos con un usuario sin privilegios (Seguridad Proactiva)
USER nonroot:nonroot

EXPOSE 8080

# Ejecución directa (sin shell intermediaria)
ENTRYPOINT ["./main"]