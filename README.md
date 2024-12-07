<h1 align="center">📦 Therapist Track</h1>
<h3 align="center"> Backend V2 </h3>

Esta nueva version de la API esta escrita en Go, en conjunto con Chi, MongoDB. Usada para el manejo de toda la logica de CRUD de expedientes y archivos.

Estas instrucciones te permitirán obtener una copia del proyecto en funcionamiento en tu máquina local para fines de desarrollo y pruebas.

# Requerimientos

- Go
  - Chi
  - Zerolog
  - Mongo Driver
- Docker
- NodeJS

# Environment variables

El `compose.yaml` necesita de ciertas variables de entorno para inicializar la BD correctamente. Este es un ejemplo un archivo `.env` con dichas variables (debe ser colocado en la raiz del proyecto):

```bash
# DATABASE
DB_ADMIN_USER=root
DB_ADMIN_PASSWORD=1234
DB_HOST=database
DB_NAME=therapisttrack
DB_USER=administrator
DB_USER_PASSWORD=1234
DB_PORT=27017

# RUNNING MODE (TEST, PRODUCTION)
# Usado para determinar el comportamiento de la app y que servicios llamar durante el testing.
RUNNING_MODE='TEST'

# BACKEND
API_PORT=3001
  #(MILISECONDS)
DELAY_START=8000 
JWT_SECRET='LocalPassword'

#CORS
ALLOWED_ORIGINS=localhost,https://therapisttrack.name
ALLOWED_CONTENT_TYPES=application/json
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization

# (FILE, CONSOLE)
LOGGING_METHOD=FILE 
LOGGING_PATH='./logs'

#CORS
ALLOWED_ORIGINS=*
ALLOWED_CONTENT_TYPES=*
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=*

# S3
AWS_ACCESS_KEY_ID=<secret>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=<secret>
AWS_BUCKET_NAME=<secret>
AWS_BUCKET_NAME_TEST=<secret>

# Auth0
AUTH_CLIENT_ID=<secret>
AUTH_CLIENT_SECRET=<secret>
AUTH_AUDIENCE=<secret>
AUTH_ISSUER_BASE_URL=<secret>

```

💡**NOTA:** Si el DB_HOST cambiara dependiendo si el backend se corre dentro de un contenedor, en esos casos el host será `database` o como lo indique el archivo `compose.yaml` usado.

# ⬇️ Instalación

Sigue estos pasos para iniciar el proyecto en tu máquina local:

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/TherapistTrack/therapistTrackApp.git
   ```

2. Instalar las dependencias del proyecto:

   ```bash
   npm install
   go mod download
   ```

3. Crear un archivo `.env` con las variables necesarias.

# 🏃‍♂️ Ejecución

Para ejecutar la aplicación en un entorno de desarrollo, puedes utilizar Node.js o Docker Compose:

## Usando Node.js:

Para esto es necesario, tener un BD operacional, en algún lado. El host de dicha DB se especifica en el archivo `.env` como se dijo arriba.

```bash
npm run start
```

## Usando Docker Compose:

Se cuentan con 2 archivos de `compose`. Pero para propositos de desarrollo te bastará con `compose.test.yaml`, este te levantara una BD y una Backend funcional.

- **Apagar y eliminar volúmenes para actualizar**

  ```bash
  docker compose -f compose.test.yaml down -v
  ```

- **Iniciar y construir la base de datos**

  ```bash
  docker compose -f compose.test.yaml up --build
  ```

## Uso de la API

La API permite realizar operaciones autenticadas relacionadas con la gestión de usuarios y pacientes. Las rutas principales incluyen:

# 📚 Documentación de la API

Esta generada con Redocly, el siguiente comando levantará un página web con la documentación

```bash
npx redocly preview-docs ./docs/api-spec.yaml
```

Esta documentación proporciona una interfaz para probar todas las rutas disponibles y ver sus especificaciones.

# 🔨 Construido con

- Go - Lenguaje de la API
- Node.js - Lenguaje en el que estan escritos los tests.