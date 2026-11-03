## Weather CLI APP

El objetivo de esta aplicación es que creemos una aplicación de consola que pida que ingresemos la ciudad, Al final, generaremos un binario ejecutable.

### Opciones:

- Ingresar el nombre de una ciudad.
- Guardar la ciudad por defecto.
- Registrar varias otras ciudades para buscar el clima en esas otras ciudades.
- Pronóstico del clima para los próximos 7 días de cualquier ciudad guardada.

## Stack

- Bun.js
- OpenMeteo

## Ejemplo de petición http:

1. Paso 1: Geocoding API.
2. Paso 2: OpenMeteo API.

```
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
```

Pronóstico de 7 días:

```
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&forecast_days=7&timezone=auto
```

## Inicializar proyecto

```bash
bun init
```

### Ejemplo del menú

```bash
════════════════════════════════════════
         WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  6. Pronóstico 7 días
  7. Listar ciudades guardadas
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
  Selecciona una opción: 5
```

### Ejecutar sin menú (flags)

```bash
weather-cli --help
weather-cli --version
weather-cli --config-path   # muestra ~/.weather-cli/config.json
```

### Testing

La suite usa `bun test` y vive en `tests/` (sin TTY ni llamadas reales a la API).

```bash
bun test              # ejecuta toda la suite
bun run test:watch    # modo watch
bun run test:coverage # reporte de cobertura
```

`bun run build` ejecuta primero los tests y el typecheck: si algo falla, no se genera el ejecutable.
