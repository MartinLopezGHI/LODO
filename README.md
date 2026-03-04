# 🏛️ LODO - Plataforma de Gestión de Startups

LODO es una solución **Full Stack** diseñada para la visualización y gestión de ecosistemas de startups.  
La arquitectura está construida bajo estándares de **alta disponibilidad, seguridad y escalabilidad**, utilizando **Google Cloud Platform** como infraestructura principal.

La plataforma permite centralizar información de startups, facilitando su gestión, visualización y escalabilidad dentro de un ecosistema tecnológico moderno.

---

# 🛠️ Tecnologías Principales

- **Frontend:** React (Vite) + Tailwind CSS + Radix UI  
- **Backend:** Go 1.24 (Clean Architecture)  
- **Infraestructura:** Google Cloud Run, Artifact Registry, Cloud SQL (MariaDB)  
- **Contenerización:** Docker & Docker Compose  
- **Servidor Web:** Nginx

---

# 🏗️ Arquitectura y Seguridad

## Gestión de Configuración (Senior Approach)

### Backend

El backend implementa un flujo **agnóstico de configuración**, evitando dependencias directas de archivos `.env` en producción.

- Utiliza variables de entorno mediante `os.Getenv`
- Permite integrarse con sistemas de gestión de secretos
- Mejora la seguridad y portabilidad entre entornos

### Frontend

El frontend utiliza **inyección de variables en tiempo de compilación (build-time args)**.

- La URL de la API se define durante el build
- Evita exponer secretos en el cliente
- Los valores quedan integrados en los assets estáticos generados por Docker

---

## Servidor de Producción (Nginx)

El frontend se sirve mediante **Nginx como servidor web de grado industrial**.

Configuración clave:

- Manejo de rutas SPA mediante `try_files`
- Evita errores `404` al refrescar rutas internas
- Optimiza la entrega de archivos estáticos

---

# 📦 Infraestructura en Google Cloud

La plataforma se despliega completamente en **Google Cloud Platform**.

Componentes principales:

- **Cloud Run** → ejecución de servicios backend y frontend en contenedores
- **Artifact Registry** → almacenamiento de imágenes Docker
- **Cloud SQL (MariaDB)** → base de datos relacional administrada
- **Docker** → empaquetado y portabilidad de servicios

Esta arquitectura permite:

- Escalado automático
- Alta disponibilidad
- Despliegue reproducible

---

# 🗂️ Estructura del Proyecto

```
lodo/
│
├── frontend/           # Aplicación React
│
├── backend/            # API en Go (Clean Architecture)
│
├── docker/             # Configuración de contenedores
│
├── docker-compose.yml  # Orquestación local
│
└── README.md
```

---

# 💻 Desarrollo Local

Para levantar todo el ecosistema localmente (Frontend, Backend y Base de Datos):

### 1️⃣ Requisitos

Instalar previamente:

- Docker Desktop
- Docker Compose

### 2️⃣ Ejecutar el proyecto

```bash
docker-compose up --build
```

Esto levantará automáticamente todos los servicios del entorno local.

---

# 🖥️ Servicios Locales

Una vez ejecutado el entorno con Docker Compose, los servicios estarán disponibles en:

| Servicio | URL / Puerto |
|--------|--------|
| Frontend | http://localhost (Puerto 80) |
| Backend | http://localhost:8080 |
| Base de Datos | Puerto 3307 (interno 3306) |

---

# 🚀 Despliegue (CI/CD)

El despliegue se basa en **imágenes inmutables almacenadas en Artifact Registry**, permitiendo despliegues seguros, versionados y reproducibles.

## Políticas de Limpieza

Se han configurado **políticas de limpieza automática en Google Cloud** para mantener únicamente las **últimas 5 versiones de cada servicio**, lo que permite:

- Optimizar el almacenamiento
- Reducir costos
- Mantener puntos de restauración seguros

---

## Comandos de Despliegue

Ejemplo de despliegue manual desde **PowerShell**:

```powershell
# Ejemplo para Frontend v5

docker build --build-arg VITE_API_URL=https://tu-api.run.app -t gcr.io/proyecto/front:v5 .

docker push gcr.io/proyecto/front:v5

gcloud run services update lodo-frontend --image gcr.io/proyecto/front:v5
```

Este flujo permite:

1. Construir la imagen Docker
2. Subirla a Artifact Registry
3. Actualizar el servicio en Cloud Run

---

# 🔒 Seguridad de Repositorio

El archivo `.gitignore` está configurado estrictamente para proteger información sensible.

Elementos protegidos:

- Archivos de secretos `.env`
- Llaves de servicio de Google Cloud (`service_account.json`)
- Dependencias locales (`node_modules`, `vendor`)
- Binarios generados
- Datos persistentes de la base de datos local (`lodo_db_data/`)

Esto asegura que **credenciales, datos sensibles y artefactos locales no se filtren al repositorio**.

---

# 👨‍💻 Autores

**Leonel Valdivia - Martín López - Gabriel Macocco - Emiliano Rodríguez**