import * as clack from "@clack/prompts";
import type { City } from "../types/City.ts";
import type { GeoResult } from "../types/GeoResult.ts";
import { cityLabel } from "../utils/format.ts";

/** Lanzada cuando el usuario cancela un prompt; se tolera volver al menú sin error. */
export class Cancelado extends Error {
  constructor() {
    super("Cancelado por el usuario");
    this.name = "Cancelado";
  }
}

/** Pide el nombre de una ciudad y devuelve el texto ya normalizado. */
export async function promptCityName(): Promise<string> {
  const query = await clack.text({
    message: "Nombre de la ciudad",
    placeholder: "Ottawa",
    validate: (value) =>
      !value || value.trim().length === 0 ? "Escribe el nombre de una ciudad." : undefined,
  });
  if (clack.isCancel(query)) throw new Cancelado();
  return query.trim();
}

/** Deja elegir una ciudad guardada y devuelve su id. */
export async function pickCity(
  message: string,
  cities: readonly City[],
  initialValue?: string,
): Promise<string> {
  const id = await clack.select({
    message,
    initialValue,
    options: cities.map((city) => ({ value: city.id, label: cityLabel(city) })),
  });
  if (clack.isCancel(id)) throw new Cancelado();
  return id;
}

/** Elige un resultado de geocoding; si solo hay uno, lo devuelve directamente. */
export async function pickSearchResult(results: readonly GeoResult[]): Promise<GeoResult> {
  const first = results[0];
  if (!first) throw new Error("La búsqueda no devolvió resultados.");
  if (results.length === 1) return first;

  const index = await clack.select({
    message: `${results.length} resultados (elige uno)`,
    options: results.map((result, i) => ({ value: String(i), label: cityLabel(result) })),
  });
  if (clack.isCancel(index)) throw new Cancelado();
  return results[Number(index)] ?? first;
}

/** Confirmación sí/no; cancela el flujo si el usuario aborta el prompt. */
export async function confirm(message: string): Promise<boolean> {
  const answer = await clack.confirm({ message });
  if (clack.isCancel(answer)) throw new Cancelado();
  return answer;
}
