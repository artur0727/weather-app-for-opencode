import type { GeoResult } from "../types/GeoResult.ts";
import { GEOCODING_RESULT_LIMIT, GEOCODING_URL } from "../utils/constants.ts";
import { fetchJson } from "./client.ts";

interface GeocodingResponse {
  results?: GeoResult[];
}

/** Busca ciudades por nombre en el servicio de geocoding. */
export async function searchCity(query: string): Promise<GeoResult[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", String(GEOCODING_RESULT_LIMIT));
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");
  const data = await fetchJson<GeocodingResponse>(url);
  return data.results ?? [];
}
