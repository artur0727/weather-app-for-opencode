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

/** Un día del pronóstico extendido. */
export interface ForecastDay {
  /** Fecha "YYYY-MM-DD" tal como la devuelve la API (zona horaria local de la ciudad). */
  date: string;
  /** Código WMO; -1 cuando la API no lo informa. */
  weatherCode: number;
  /** Temperatura máxima del día, en la unidad configurada. */
  tempMax: number;
  /** Temperatura mínima del día, en la unidad configurada. */
  tempMin: number;
  /** Probabilidad máxima de precipitación en %, o null cuando la API no la informa. */
  precipitationProbability: number | null;
}
