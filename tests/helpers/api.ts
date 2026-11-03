import type { ForecastDay } from "../../src/types/Weather.ts";

type FetchImpl = (...args: Parameters<typeof fetch>) => Promise<Response>;

const originalFetch = globalThis.fetch;

/** Sustituye `fetch` sin salir a la red; cada test decide qué devolver. */
export function stubFetch(impl: FetchImpl): void {
  globalThis.fetch = impl as unknown as typeof fetch;
}

/** Restaura el `fetch` real (llamar en `afterEach`). */
export function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

/** Respuesta JSON de Open-Meteo simulada. */
export function jsonResponse(payload: unknown, status = 200): Response {
  return Response.json(payload, { status });
}

/** Convierte el primer argumento de `fetch` (URL | Request | string) en URL. */
export function toUrl(input: Parameters<typeof fetch>[0]): URL {
  return input instanceof URL ? input : new URL(input instanceof Request ? input.url : input);
}

/** Pronóstico diario simulado con `days` días completos. */
export function makeDailyPayload(days: number): {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: (number | null)[];
  };
} {
  const dates: string[] = [];
  const max: number[] = [];
  const min: number[] = [];
  const codes: number[] = [];
  const precipitation: (number | null)[] = [];

  for (let i = 0; i < days; i += 1) {
    const day = String(4 + i).padStart(2, "0");
    dates.push(`2026-11-${day}`);
    max.push(18.4 + i);
    min.push(7.1 + i);
    codes.push(3);
    precipitation.push(i === 1 ? null : 40);
  }

  return {
    daily: {
      time: dates,
      temperature_2m_max: max,
      temperature_2m_min: min,
      weather_code: codes,
      precipitation_probability_max: precipitation,
    },
  };
}

/** Día de pronóstico esperado para la posición `i` del payload de `makeDailyPayload`. */
export function makeExpectedDay(i: number): ForecastDay {
  return {
    date: `2026-11-${String(4 + i).padStart(2, "0")}`,
    weatherCode: 3,
    tempMax: 18.4 + i,
    tempMin: 7.1 + i,
    precipitationProbability: i === 1 ? null : 40,
  };
}
