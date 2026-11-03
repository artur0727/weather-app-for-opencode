import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { listCities } from "../../src/actions/listCities.ts";
import { captureConsole } from "../helpers/actions.ts";
import { clack, resetClack } from "../helpers/clack.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

let capture: ReturnType<typeof captureConsole> | undefined;

beforeEach(() => {
  resetClack();
  capture = captureConsole();
});

afterEach(() => {
  capture?.restore();
});

describe("listCities", () => {
  it("avisa cuando no hay ciudades guardadas", async () => {
    const config = makeConfig();
    const next = await listCities(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe("No hay ciudades guardadas.");
    expect(capture?.logs).toEqual([]);
  });

  it("lista las ciudades marcando la default", async () => {
    const config = makeConfig({
      cities: [
        makeCity({ id: "ottawa" }),
        makeCity({ id: "madrid", name: "Madrid", country: "España", admin1: undefined }),
      ],
      defaultCityId: "ottawa",
    });

    const next = await listCities(config);

    expect(next).toBe(config);
    expect(capture?.logs[0]).toBe("Ciudades guardadas (2)");
    expect(capture?.logs[1]).toBe("  Ottawa, Ontario (Canadá) (default)");
    expect(capture?.logs[2]).toBe("  Madrid (España)");
    expect(clack.log.warn).not.toHaveBeenCalled();
  });
});
