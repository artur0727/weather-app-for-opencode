/** Resultado crudo del servicio de geocoding, antes de convertirse en City. */
export interface GeoResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}
