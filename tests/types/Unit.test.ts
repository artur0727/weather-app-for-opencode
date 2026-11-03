import { describe, expect, expectTypeOf, it } from "bun:test";
import type { Unit } from "../../src/types/Unit.ts";

describe("Unit", () => {
  it("solo admite celsius y fahrenheit", () => {
    const units = ["celsius", "fahrenheit"] as const satisfies readonly Unit[];

    expect(units).toEqual(["celsius", "fahrenheit"]);
    expectTypeOf<Unit>().toEqualTypeOf<"celsius" | "fahrenheit">();
  });
});
