import { beforeEach, describe, expect, it } from "bun:test";
import { withSpinner } from "../../src/presentation/loading.ts";
import { resetClack, spinners } from "../helpers/clack.ts";

beforeEach(() => {
  resetClack();
});

describe("withSpinner", () => {
  it("arranca el spinner, ejecuta la tarea y lo detiene al terminar", async () => {
    const result = await withSpinner("Consultando…", async () => 42);

    expect(result).toBe(42);
    expect(spinners).toHaveLength(1);
    expect(spinners[0]?.start.mock.calls[0]?.[0]).toBe("Consultando…");
    expect(spinners[0]?.stop).toHaveBeenCalledTimes(1);
  });

  it("permite actualizar el mensaje del spinner desde la tarea", async () => {
    await withSpinner("Buscando…", async (update) => {
      update("Procesando…");
      update("Listo");
      return "ok";
    });

    expect(spinners[0]?.message.mock.calls.map(([message]) => message)).toEqual([
      "Procesando…",
      "Listo",
    ]);
  });

  it("detiene el spinner y relanza el mismo error si la tarea falla", async () => {
    const error = new Error("falló la API");

    await expect(
      withSpinner("Consultando…", async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(spinners[0]?.stop).toHaveBeenCalledTimes(1);
  });
});
