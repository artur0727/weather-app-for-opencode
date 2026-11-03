import { afterEach, describe, expect, it } from "bun:test";
import { searchCity } from "../../src/api/geocoding.ts";
import type { GeoResult } from "../../src/types/GeoResult.ts";
import { jsonResponse, restoreFetch, stubFetch, toUrl } from "../helpers/api.ts";

afterEach(() => {
  restoreFetch();
});

const result: GeoResult = {
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  country: "Canadá",
  admin1: "Ontario",
};

describe("searchCity", () => {
  it("consulta el geocoding con el nombre normalizado y los filtros esperados", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse({ results: [result] });
    });

    await searchCity("  Ottawa  ");

    const requested = calls[0];
    expect(calls).toHaveLength(1);
    expect(requested?.origin).toBe("https://geocoding-api.open-meteo.com");
    expect(requested?.pathname).toBe("/v1/search");
    expect(requested?.searchParams.get("name")).toBe("Ottawa");
    expect(requested?.searchParams.get("count")).toBe("5");
    expect(requested?.searchParams.get("language")).toBe("es");
    expect(requested?.searchParams.get("format")).toBe("json");
  });

  it("devuelve los resultados de la API", async () => {
    stubFetch(async () => jsonResponse({ results: [result] }));

    await expect(searchCity("Ottawa")).resolves.toEqual([result]);
  });

  it("devuelve una lista vacía cuando no hay resultados", async () => {
    stubFetch(async () => jsonResponse({}));

    await expect(searchCity("Atlantis")).resolves.toEqual([]);
  });
});
