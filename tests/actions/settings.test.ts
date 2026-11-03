import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { settings } from "../../src/actions/settings.ts";
import { Cancelado } from "../../src/presentation/input.ts";
import {
  captureConsole,
  clearSavedConfig,
  readSavedConfig,
} from "../helpers/actions.ts";
import {
  CANCEL,
  clack,
  confirmPrompts,
  queueConfirm,
  resetClack,
} from "../helpers/clack.ts";
import { makeConfig } from "../helpers/fixtures.ts";

let capture: ReturnType<typeof captureConsole> | undefined;

beforeEach(async () => {
  resetClack();
  await clearSavedConfig();
  capture = captureConsole();
});

afterEach(async () => {
  capture?.restore();
  await clearSavedConfig();
});

describe("settings", () => {
  it("cambia de celsius a fahrenheit y persiste la preferencia", async () => {
    queueConfirm(true);

    const config = makeConfig({ unit: "celsius" });
    const next = await settings(config);

    expect(confirmPrompts[0]?.message).toBe(
      "Cambiar la unidad de temperatura a °F?",
    );
    expect(next.unit).toBe("fahrenheit");
    expect(next).not.toBe(config);
    expect(config.unit).toBe("celsius");
    expect(await readSavedConfig()).toEqual(next);
    expect(clack.log.success.mock.calls[0]?.[0]).toBe("Unidad de temperatura: °F");
  });

  it("cambia de fahrenheit a celsius", async () => {
    queueConfirm(true);

    const config = makeConfig({ unit: "fahrenheit" });
    const next = await settings(config);

    expect(confirmPrompts[0]?.message).toBe(
      "Cambiar la unidad de temperatura a °C?",
    );
    expect(next.unit).toBe("celsius");
    expect(clack.log.success.mock.calls[0]?.[0]).toBe("Unidad de temperatura: °C");
  });

  it("no cambia nada si el usuario rechaza la confirmación", async () => {
    queueConfirm(false);

    const config = makeConfig({ unit: "celsius" });
    const next = await settings(config);

    expect(next).toBe(config);
    expect(await readSavedConfig()).toBeNull();
    expect(clack.log.success).not.toHaveBeenCalled();
  });

  it("propaga la cancelación de la confirmación", async () => {
    queueConfirm(CANCEL);

    await expect(settings(makeConfig())).rejects.toBeInstanceOf(Cancelado);
    expect(await readSavedConfig()).toBeNull();
  });
});
