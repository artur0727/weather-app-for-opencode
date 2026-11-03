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

/** Datos de una ciudad antes de calcular su identificador estable. */
export type CityInput = Omit<City, "id">;
