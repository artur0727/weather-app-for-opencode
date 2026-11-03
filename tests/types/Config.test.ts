import { describe, expect, expectTypeOf, it } from "bun:test";
import type { City } from "../../src/types/City.ts";
import type { Config } from "../../src/types/Config.ts";
import type { Unit } from "../../src/types/Unit.ts";
import { makeConfig } from "../helpers/fixtures.ts";

describe("Config", () => {
  it("modela el estado persistido en config.json", () => {
    expectTypeOf<Config>().toEqualTypeOf<{
      defaultCityId: string | null;
      unit: Unit;
      cities: City[];
    }>();
  });

  it("el fixture cumple la forma y arranca sin ciudad default", () => {
    const config = makeConfig();

    expect(Object.keys(config)).toEqual(["defaultCityId", "unit", "cities"]);
    expect(config.defaultCityId).toBeNull();
    expect(config.unit).toBe("celsius");
    expect(config.cities).toEqual([]);
  });
});
