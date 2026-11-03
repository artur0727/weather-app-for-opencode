import { REQUEST_TIMEOUT_MS } from "../utils/constants.ts";

/** Error de la capa de red/API con mensaje listo para mostrar al usuario. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Consulta una URL y devuelve el JSON tipado, traduciendo fallos a `ApiError`. */
export async function fetchJson<T>(url: URL): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new ApiError("La consulta tardó demasiado. Verifica tu conexión a internet.");
    }
    throw new ApiError("Error de red. Verifica tu conexión a internet.");
  }
  if (!response.ok) {
    throw new ApiError(`El servicio de Open-Meteo respondió con error (HTTP ${response.status}).`);
  }
  return (await response.json()) as T;
}
