import { describe, expect, expectTypeOf, it } from "bun:test";
import type { CityInput } from "../../src/types/City.ts";
import type { GeoResult } from "../../src/types/GeoResult.ts";
import { makeCityInput } from "../helpers/fixtures.ts";

describe("GeoResult", () => {
  it("tiene la misma forma que CityInput (sin id)", () => {
    expectTypeOf<GeoResult>().toEqualTypeOf<CityInput>();
  });

  it("se puede convertir en City agregando el id derivado", () => {
    const result = makeCityInput();
    const converted = { ...result, id: "ottawa" };

    expect(converted).toMatchObject({
      name: "Ottawa",
      country: "Canadá",
      admin1: "Ontario",
      latitude: 45.41117,
      longitude: -75.69812,
    });
  });
});
