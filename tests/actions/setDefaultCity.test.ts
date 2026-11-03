import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";
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

describe("setDefaultCity", () => {
  it("avisa y no guarda cuando no hay ciudades", async () => {
    const config = makeConfig();
    const next = await setDefaultCity(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe("No hay ciudades guardadas.");
    expect(selectPrompts).toHaveLength(0);
    expect(await readSavedConfig()).toBeNull();
  });

  it("establece la ciudad elegida como default y la persiste", async () => {
    queueSelect("madrid");

    const config = makeConfig({ cities, defaultCityId: "ottawa" });
    const next = await setDefaultCity(config);

    expect(selectPrompts[0]?.message).toBe("Ciudad default");
    expect(selectPrompts[0]?.options.map((option) => option.value)).toEqual([
      "ottawa",
      "madrid",
    ]);
    expect(next.defaultCityId).toBe("madrid");
    expect(next.cities).toEqual(cities);
    expect(await readSavedConfig()).toEqual(next);
    expect(clack.log.success.mock.calls[0]?.[0]).toBe("Ciudad default: Madrid (España)");
  });

  it("no altera el config original", async () => {
    queueSelect("madrid");

    const config = makeConfig({ cities, defaultCityId: "ottawa" });
    await setDefaultCity(config);

    expect(config.defaultCityId).toBe("ottawa");
  });

  it("propaga la cancelación del selector", async () => {
    queueSelect(CANCEL);

    const config = makeConfig({ cities, defaultCityId: "ottawa" });

    await expect(setDefaultCity(config)).rejects.toBeInstanceOf(Cancelado);
    expect(await readSavedConfig()).toBeNull();
  });
});
