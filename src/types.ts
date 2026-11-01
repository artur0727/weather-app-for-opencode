/** Unidad de temperatura configurada por el usuario. */
export type Unit = "celsius" | "fahrenheit";

/** Ciudad guardada por el usuario, con coordenadas resueltas por geocoding. */
export interface City {
  /** Identificador estable derivado de nombre + país + coordenadas. */
  id: string;
  name: string;
  /** País en el idioma devuelto por la API ("es"), p. ej. "Canadá". */
  country?: string;
  /** Estado / provincia si la API lo informa, p. ej. "Ontario". */
  admin1?: string;
  latitude: number;
  longitude: number;
}

/** Estado persistente en ~/.weather-cli/config.json. */
export interface Config {
  /** id de la ciudad default, o null si aún no hay ninguna. */
  defaultCityId: string | null;
  unit: Unit;
  cities: City[];
}

/** Clima actual devuelto por la API de pronóstico. */
export interface WeatherInfo {
  /** Temperatura en la unidad configurada. */
  temperature: number;
  /** Temperatura aparente en la unidad configurada. */
  apparentTemperature: number;
  /** Código WMO; -1 cuando la API no lo informa. */
  weatherCode: number;
  /** Velocidad del viento en km/h. */
  windSpeed: number;
}

/** Resultado crudo del servicio de geocoding, antes de convertirse en City. */
export interface GeoResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}
