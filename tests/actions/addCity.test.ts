import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { addCity } from "../../src/actions/addCity.ts";
import { cityIdFor } from "../../src/storage/citiesStorage.ts";
import {
  captureConsole,
  clearSavedConfig,
  readSavedConfig,
} from "../helpers/actions.ts";
import { jsonResponse, restoreFetch, stubFetch, toUrl } from "../helpers/api.ts";
import {
  clack,
  queueSelect,
  queueText,
  resetClack,
  selectPrompts,
  spinners,
} from "../helpers/clack.ts";
import { makeCity, makeCityInput, makeConfig } from "../helpers/fixtures.ts";

const ottawa = makeCityInput();
const madrid = makeCityInput({
  name: "Madrid",
  country: "España",
  admin1: undefined,
  latitude: 40.4165,
  longitude: -3.7026,
});

let capture: ReturnType<typeof captureConsole> | undefined;

function stubSearch(results: unknown[]): URL[] {
  const calls: URL[] = [];
  stubFetch(async (input) => {
    calls.push(toUrl(input));
    return jsonResponse({ results });
  });
  return calls;
}

beforeEach(async () => {
  resetClack();
  await clearSavedConfig();
  capture = captureConsole();
});

afterEach(async () => {
  capture?.restore();
  restoreFetch();
  await clearSavedConfig();
});

describe("addCity", () => {
  it("busca, agrega la ciudad elegida y la persiste", async () => {
    const calls = stubSearch([ottawa]);
    queueText("  Ottawa  ");

    const config = makeConfig();
    const next = await addCity(config);

    expect(calls[0]?.searchParams.get("name")).toBe("Ottawa");
    expect(next.cities).toHaveLength(1);
    expect(next.cities[0]).toMatchObject({
      id: cityIdFor(ottawa),
      name: "Ottawa",
      country: "Canadá",
      admin1: "Ontario",
    });
    expect(next.defaultCityId).toBe(cityIdFor(ottawa));
    expect(await readSavedConfig()).toEqual(next);
    expect(clack.log.success.mock.calls[0]?.[0]).toBe(
      "Ottawa, Ontario (Canadá) agregada.",
    );
    expect(clack.log.info.mock.calls[0]?.[0]).toBe("Establecida como ciudad default.");
    expect(spinners[0]?.start.mock.calls[0]?.[0]).toBe('Buscando "Ottawa"…');
    expect(spinners[0]?.stop).toHaveBeenCalledTimes(1);
    expect(config.cities).toHaveLength(0);
  });

  it("avisa y no guarda nada cuando no hay resultados", async () => {
    stubSearch([]);
    queueText("Atlantis");

    const config = makeConfig({ cities: [makeCity()], defaultCityId: "ottawa" });
    const next = await addCity(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe(
      'No se encontró ninguna ciudad con "Atlantis".',
    );
    expect(selectPrompts).toHaveLength(0);
    expect(await readSavedConfig()).toBeNull();
  });

  it("permite elegir entre varios resultados de geocoding", async () => {
    stubSearch([ottawa, madrid]);
    queueText("Ottawa");
    queueSelect("1");

    const next = await addCity(makeConfig());

    expect(selectPrompts[0]?.options).toEqual([
      { value: "0", label: "Ottawa, Ontario (Canadá)" },
      { value: "1", label: "Madrid (España)" },
    ]);
    expect(next.cities[0]?.name).toBe("Madrid");
    expect(clack.log.success.mock.calls[0]?.[0]).toBe("Madrid (España) agregada.");
  });

  it("avisa cuando la ciudad ya estaba guardada y no la duplica", async () => {
    const id = cityIdFor(ottawa);
    const config = makeConfig({
      cities: [makeCity({ id })],
      defaultCityId: id,
    });
    stubSearch([ottawa]);
    queueText("Ottawa");

    const next = await addCity(config);

    expect(next.cities).toHaveLength(1);
    expect(next.cities[0]?.id).toBe(id);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe(
      "Ottawa, Ontario (Canadá) ya estaba guardada (se actualizaron sus datos).",
    );
    expect(clack.log.success).not.toHaveBeenCalled();
    expect(clack.log.info).not.toHaveBeenCalled();
    expect(await readSavedConfig()).toEqual(next);
  });
});
