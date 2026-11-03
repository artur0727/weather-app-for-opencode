import { describe, expect, expectTypeOf, it } from "bun:test";
import type { City, CityInput } from "../../src/types/City.ts";
import { makeCityInput } from "../helpers/fixtures.ts";

describe("City / CityInput", () => {
  it("exige id y coordenadas y deja país/provincia como opcionales", () => {
    expectTypeOf<City>().toExtend<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    }>();
    expectTypeOf<City["country"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<City["admin1"]>().toEqualTypeOf<string | undefined>();
  });

  it("CityInput es City sin el id derivado", () => {
    expectTypeOf<CityInput>().toEqualTypeOf<Omit<City, "id">>();

    const input = makeCityInput();
    const city: City = { ...input, id: "ottawa" };

    expect(city.id).toBe("ottawa");
    expect(city.name).toBe("Ottawa");
    expect(city.latitude).toBeCloseTo(45.41117);
  });
});
