import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { removeCity } from "../../src/actions/removeCity.ts";
import { Cancelado } from "../../src/presentation/input.ts";
import {
  captureConsole,
  clearSavedConfig,
  readSavedConfig,
} from "../helpers/actions.ts";
import {
  CANCEL,
  clack,
  queueSelect,
  resetClack,
  selectPrompts,
} from "../helpers/clack.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

let capture: ReturnType<typeof captureConsole> | undefined;

const cities = [
  makeCity({ id: "ottawa" }),
  makeCity({
    id: "madrid",
    name: "Madrid",
    country: "España",
    admin1: undefined,
    latitude: 40.4165,
    longitude: -3.7026,
  }),
];

beforeEach(async () => {
  resetClack();
  await clearSavedConfig();
  capture = captureConsole();
});

afterEach(async () => {
  capture?.restore();
  await clearSavedConfig();
});

describe("removeCity", () => {
  it("avisa y no guarda cuando no hay ciudades", async () => {
    const config = makeConfig();
    const next = await removeCity(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe("No hay ciudades guardadas.");
    expect(selectPrompts).toHaveLength(0);
    expect(await readSavedConfig()).toBeNull();
  });

  it("elimina la ciudad elegida y persiste el cambio", async () => {
    queueSelect("madrid");

    const config = makeConfig({ cities, defaultCityId: "ottawa" });
    const next = await removeCity(config);

    expect(selectPrompts[0]?.message).toBe("Ciudad a eliminar");
    expect(next.cities.map((city) => city.id)).toEqual(["ottawa"]);
    expect(next.defaultCityId).toBe("ottawa");
    expect(await readSavedConfig()).toEqual(next);
    expect(clack.log.success.mock.calls[0]?.[0]).toBe("Ciudad eliminada: Madrid (España)");
  });

  it("reasigna la default cuando se elimina la ciudad default", async () => {
    queueSelect("ottawa");

    const config = makeConfig({ cities, defaultCityId: "ottawa" });
    const next = await removeCity(config);

    expect(next.cities.map((city) => city.id)).toEqual(["madrid"]);
    expect(next.defaultCityId).toBe("madrid");
    expect(await readSavedConfig()).toEqual(next);
  });

  it("no cambia nada si el id elegido ya no existe", async () => {
    queueSelect("fantasma");

    const config = makeConfig({ cities, defaultCityId: "ottawa" });
    const next = await removeCity(config);

    expect(next.cities).toEqual(cities);
    expect(next.defaultCityId).toBe("ottawa");
    expect(await readSavedConfig()).toEqual(next);
    expect(clack.log.success).not.toHaveBeenCalled();
  });

  it("propaga la cancelación del selector", async () => {
    queueSelect(CANCEL);

    const config = makeConfig({ cities, defaultCityId: "ottawa" });

    await expect(removeCity(config)).rejects.toBeInstanceOf(Cancelado);
    expect(await readSavedConfig()).toBeNull();
  });
});
