import { afterEach, describe, expect, it } from "bun:test";
import { ApiError, fetchJson } from "../../src/api/client.ts";
import { jsonResponse, restoreFetch, stubFetch, toUrl } from "../helpers/api.ts";

afterEach(() => {
  restoreFetch();
});

const url = (): URL => new URL("https://api.example.com/data");

describe("fetchJson", () => {
  it("devuelve el JSON tipado cuando la respuesta es 200", async () => {
    stubFetch(async () => jsonResponse({ temperature: 12.5 }));

    await expect(fetchJson<{ temperature: number }>(url())).resolves.toEqual({ temperature: 12.5 });
  });

  it("envía la URL y una señal de timeout", async () => {
    let requested: URL | undefined;
    let signal: AbortSignal | null | undefined;
    stubFetch(async (input, init) => {
      requested = toUrl(input);
      signal = init?.signal;
      return jsonResponse({});
    });

    await fetchJson(url());

    expect(requested?.toString()).toBe("https://api.example.com/data");
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("traduce una respuesta no exitosa a ApiError con el status", async () => {
    stubFetch(async () => new Response("sin datos", { status: 503 }));

    const promise = fetchJson(url());

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow("El servicio de Open-Meteo respondió con error (HTTP 503).");
  });

  it("traduce un fallo de red a ApiError", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(fetchJson(url())).rejects.toThrow(
      "Error de red. Verifica tu conexión a internet.",
    );
  });

  it("traduce un timeout de AbortSignal a ApiError", async () => {
    stubFetch(async () => {
      const error = new Error("The operation was aborted");
      error.name = "TimeoutError";
      throw error;
    });

    await expect(fetchJson(url())).rejects.toThrow(
      "La consulta tardó demasiado. Verifica tu conexión a internet.",
    );
  });

  it("también reconoce AbortError como timeout", async () => {
    stubFetch(async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    });

    await expect(fetchJson(url())).rejects.toBeInstanceOf(ApiError);
  });
});
