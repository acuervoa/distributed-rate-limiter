# distributed-rate-limiter

# API con Límite de Tasa

Este proyecto es una API sencilla basada en Express.js con funcionalidad de límite de tasa utilizando Redis y scripting en Lua. La API proporciona una característica básica de limitación de tasa para asegurar que los usuarios estén restringidos en el número de solicitudes que pueden realizar durante un período definido. El mecanismo de limitación de tasa se implementa con la ayuda de Redis para un conteo y almacenamiento eficiente de solicitudes, ideal para escenarios de alto rendimiento.

Basado en el artículo https://www.freecodecamp.org/news/build-rate-limiting-system-using-redis-and-lua/ con modificaciones propias.

## Características

- Limitación de tasa utilizando Redis para alta eficiencia.
- Integración de scripts Lua para gestionar los límites de manera atómica.
- Configuración con Docker para una fácil implementación.

## Requisitos Previos

Para ejecutar este proyecto, necesitarás lo siguiente:

- Node.js (v14 o superior)
- Redis
- Docker (opcional, para despliegue en contenedor)
- Docker Compose (opcional)

## Configuración

1. **Clonar el Repositorio**
   ```sh
   git clone https://github.com/acuervoa/rate-limited-api.git
   cd rate-limited-api
   ```

2. **Instalar Dependencias**
   ```sh
   npm install
   ```

3. **Configuración del Entorno**

   Crea un archivo `.env` en el directorio raíz y añade las siguientes variables de entorno:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   RATE_LIMIT=100       # Número de solicitudes permitidas
   TIME_WINDOW=60       # Ventana de tiempo en segundos
   PORT=3000
   ```

4. **Iniciar Redis**
   - Si tienes Redis instalado localmente, puedes iniciarlo con:
     ```sh
     redis-server
     ```
   - Alternativamente, puedes ejecutar Redis usando Docker:
     ```sh
     docker run -d --name redis -p 6379:6379 redis
     ```

5. **Iniciar el Servidor**
   ```sh
   node server.js
   ```
   El servidor se iniciará en el puerto especificado en el archivo `.env` (por defecto: 3000).

## Ejecución con Docker

Para simplificar la implementación, también puedes usar Docker para ejecutar toda la configuración.

1. **Crear una Red de Docker** (para enlazar los contenedores):
   ```sh
   docker network create rate-limit-net
   ```

2. **Ejecutar Redis en un Contenedor**:
   ```sh
   docker run -d --name redis --network rate-limit-net redis
   ```

3. **Construir y Ejecutar la Aplicación**:
   ```sh
   docker build -t rate-limiter .
   docker run -p 3000:3000 --name rate-limiter --network rate-limit-net -e REDIS_HOST=redis -e REDIS_PORT=6379 rate-limiter
   ```

## Script Lua para la Limitación de Tasa

El script Lua (`rate_limiter.lua`) maneja la lógica para la limitación de tasa de manera atómica para evitar condiciones de carrera. Verifica si el conteo actual de solicitudes excede el límite definido y, o bien incrementa el conteo o devuelve un error.

```lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local current = redis.call("get", key)

if current and tonumber(current) >= limit then
    return 0
else
    if current then
        redis.call("incr", key)
    else
        redis.call("set", key, 1, "EX", window)
    end
    return 1
end
```

## Pruebas de la API

Una vez que el servidor esté en funcionamiento, puedes probar la API usando `curl` o una herramienta como Postman.

```sh
curl http://localhost:3000/
```
Si se excede el límite de solicitudes, recibirás una respuesta con el código de estado HTTP `429`:

```json
{
  "message": "Too many requests. Please try again later."
}
```

## Estructura del Proyecto

- `server.js`: Archivo principal del servidor que contiene la lógica de la API.
- `rate_limiter.lua`: Script Lua para la limitación de tasa.
- `.env`: Archivo de variables de entorno (no incluido en el repositorio, debe ser creado).
- `Dockerfile`: Dockerfile para contenedorización de la aplicación.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.

## Contribuciones

¡Las contribuciones son bienvenidas! No dudes en abrir un issue o enviar un pull request.



