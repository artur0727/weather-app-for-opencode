import { beforeEach, describe, expect, it } from "bun:test";
import {
  menuActions,
  menuOptions,
  selectMenuOption,
} from "../../src/presentation/menu.ts";
import { MENU_EXIT_VALUE } from "../../src/utils/constants.ts";
import {
  CANCEL,
  queueSelect,
  resetClack,
  selectPrompts,
} from "../helpers/clack.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

beforeEach(() => {
  resetClack();
});

describe("menuOptions", () => {
  const options = menuOptions(makeConfig({ unit: "fahrenheit", cities: [makeCity()] }));

  it("mantiene las 9 opciones numeradas", () => {
    expect(options.map((option) => option.value)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ]);
  });

  it("refleja el estado del config en las etiquetas", () => {
    const labels = options.map((option) => option.label);

    expect(labels[0]).toBe("1. Clima de ciudad default");
    expect(labels[1]).toBe("2. Clima de todas las ciudades (1)");
    expect(labels[5]).toBe("6. Pronóstico 7 días");
    expect(labels[7]).toBe("8. Ajustes (°F)");
    expect(labels[8]).toBe("9. Salir");
  });

  it("cuenta cero ciudades cuando el config está vacío", () => {
    const [second] = menuOptions(makeConfig()).filter((option) => option.value === "2");

    expect(second?.label).toBe("2. Clima de todas las ciudades (0)");
  });

  it("muestra la unidad activa en los ajustes", () => {
    const [settings] = menuOptions(makeConfig({ unit: "celsius" })).filter(
      (option) => option.value === "8",
    );

    expect(settings?.label).toBe("8. Ajustes (°C)");
  });
});

describe("menuActions", () => {
  it("mapea las opciones 1 a 8 a funciones", () => {
    expect(Object.keys(menuActions).sort()).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
    for (const key of Object.keys(menuActions)) {
      expect(typeof menuActions[key]).toBe("function");
    }
  });

  it("no mapea la opción de salir", () => {
    expect(MENU_EXIT_VALUE).toBe("9");
    expect(menuActions[MENU_EXIT_VALUE]).toBeUndefined();
  });
});

describe("selectMenuOption", () => {
  it("devuelve la opción elegida y ofrece las 9 opciones del config actual", async () => {
    queueSelect("3");

    const config = makeConfig({ cities: [makeCity()], defaultCityId: "ottawa" });
    const selection = await selectMenuOption(config);

    expect(selection).toBe("3");
    expect(selectPrompts[0]?.message).toBe("Selecciona una opción");
    expect(selectPrompts[0]?.options).toHaveLength(9);
    expect(selectPrompts[0]?.options[1]?.label).toBe(
      "2. Clima de todas las ciudades (1)",
    );
  });

  it("devuelve null cuando se elige salir", async () => {
    queueSelect(MENU_EXIT_VALUE);

    await expect(selectMenuOption(makeConfig())).resolves.toBeNull();
  });

  it("devuelve null cuando se cancela el menú", async () => {
    queueSelect(CANCEL);

    await expect(selectMenuOption(makeConfig())).resolves.toBeNull();
  });
});
