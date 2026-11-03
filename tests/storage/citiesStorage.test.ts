import { describe, expect, it } from "bun:test";
import {
  addCityToConfig,
  cityIdFor,
  getCity,
  getDefaultCity,
  isCity,
  removeCityFromConfig,
  setDefaultCityInConfig,
} from "../../src/storage/citiesStorage.ts";
import { makeCity, makeCityInput, makeConfig } from "../helpers/fixtures.ts";

describe("cityIdFor", () => {
  it("combina nombre, país, provincia y coordenadas normalizadas", () => {
    expect(cityIdFor(makeCityInput())).toBe("ottawa-canada-ontario-45.411,-75.698");
  });

  it("quita acentos y caracteres no alfanuméricos", () => {
    expect(
      cityIdFor(
        makeCityInput({
          name: "São Paulo",
          country: "Brasil",
          admin1: undefined,
          latitude: -23.5506,
          longitude: -46.6333,
        }),
      ),
    ).toBe("sao-paulo-brasil--23.551,-46.633");
  });

  it("ignora provincias vacías y colapsa separadores repetidos", () => {
    expect(
      cityIdFor(
        makeCityInput({
          name: "New   York!",
          country: undefined,
          admin1: undefined,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      ),
    ).toBe("new-york-40.713,-74.006");
  });

  it("es estable para la misma entrada y distinto para otras coordenadas", () => {
    const input = makeCityInput();
    expect(cityIdFor(input)).toBe(cityIdFor({ ...input }));
    expect(cityIdFor({ ...input, latitude: 45.5 })).not.toBe(cityIdFor(input));
  });
});

describe("isCity", () => {
  it("acepta una ciudad completa", () => {
    expect(isCity(makeCity())).toBe(true);
  });

  it("rechaza valores que no tienen forma de ciudad", () => {
    expect(isCity(null)).toBe(false);
    expect(isCity("ottawa")).toBe(false);
    expect(isCity({})).toBe(false);
    expect(isCity({ ...makeCity(), latitude: "45" })).toBe(false);
    expect(isCity({ ...makeCity(), name: undefined })).toBe(false);
  });
});

describe("addCityToConfig", () => {
  it("agrega la ciudad con su id derivado y la deja como default", () => {
    const next = addCityToConfig(makeConfig(), makeCityInput());
    const added = next.cities[0];

    expect(next.cities).toHaveLength(1);
    expect(added?.id).toBe(cityIdFor(makeCityInput()));
    expect(added?.name).toBe("Ottawa");
    expect(next.defaultCityId).toBe(cityIdFor(makeCityInput()));
  });

  it("no pisa el default cuando ya hay una ciudad default", () => {
    const base = makeConfig({ defaultCityId: "otra" });
    const next = addCityToConfig(base, makeCityInput({ name: "Toronto", latitude: 43.6532 }));

    expect(next.cities).toHaveLength(1);
    expect(next.defaultCityId).toBe("otra");
  });

  it("no duplica una ciudad ya guardada", () => {
    const once = addCityToConfig(makeConfig(), makeCityInput());
    const twice = addCityToConfig(once, makeCityInput());

    expect(twice.cities).toHaveLength(1);
    expect(twice).not.toBe(once);
    expect(twice.cities[0]?.id).toBe(once.cities[0]?.id);
  });

  it("no muta el config original", () => {
    const base = makeConfig();
    addCityToConfig(base, makeCityInput());

    expect(base.cities).toEqual([]);
    expect(base.defaultCityId).toBeNull();
  });
});

describe("removeCityFromConfig", () => {
  const first = makeCity({ id: "a", name: "Ottawa" });
  const second = makeCity({ id: "b", name: "Toronto" });
  const config = makeConfig({ defaultCityId: "a", cities: [first, second] });

  it("reasigna el default a la primera ciudad restante", () => {
    const next = removeCityFromConfig(config, "a");

    expect(next.cities.map((city) => city.id)).toEqual(["b"]);
    expect(next.defaultCityId).toBe("b");
  });

  it("conserva el default si se elimina otra ciudad", () => {
    const next = removeCityFromConfig(config, "b");

    expect(next.cities.map((city) => city.id)).toEqual(["a"]);
    expect(next.defaultCityId).toBe("a");
  });

  it("deja el default en null al eliminar la última ciudad", () => {
    const next = removeCityFromConfig(makeConfig({ defaultCityId: "a", cities: [first] }), "a");

    expect(next.cities).toEqual([]);
    expect(next.defaultCityId).toBeNull();
  });

  it("ignora ids desconocidos sin mutar el config", () => {
    const next = removeCityFromConfig(config, "zzz");

    expect(next.cities).toHaveLength(2);
    expect(next.defaultCityId).toBe("a");
    expect(config.cities).toHaveLength(2);
  });
});

describe("setDefaultCityInConfig", () => {
  it("devuelve un config nuevo con el default indicado", () => {
    const base = makeConfig({ defaultCityId: "a" });
    const next = setDefaultCityInConfig(base, "b");

    expect(next.defaultCityId).toBe("b");
    expect(base.defaultCityId).toBe("a");
    expect(next).not.toBe(base);
  });
});

describe("getCity / getDefaultCity", () => {
  const first = makeCity({ id: "a" });
  const second = makeCity({ id: "b", name: "Toronto" });
  const config = makeConfig({ defaultCityId: "b", cities: [first, second] });

  it("encuentra ciudades por id", () => {
    expect(getCity(config, "b")).toBe(second);
    expect(getCity(config, "zzz")).toBeUndefined();
  });

  it("devuelve la ciudad default o undefined", () => {
    expect(getDefaultCity(config)).toBe(second);
    expect(getDefaultCity(makeConfig())).toBeUndefined();
    expect(getDefaultCity(makeConfig({ defaultCityId: "zzz" }))).toBeUndefined();
  });
});
