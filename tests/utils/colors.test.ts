import { afterEach, describe, expect, it } from "bun:test";
import { cyan, cyanBold, dim, green, red, yellow } from "../../src/utils/colors.ts";

const ANSI = "\u001b[";
const palette = { cyan, cyanBold, yellow, green, red, dim };

const originalNoColor = process.env.NO_COLOR;
const originalForceColor = process.env.FORCE_COLOR;

function restoreColorEnv(): void {
  if (originalNoColor === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = originalNoColor;
  if (originalForceColor === undefined) delete process.env.FORCE_COLOR;
  else process.env.FORCE_COLOR = originalForceColor;
}

afterEach(() => {
  restoreColorEnv();
});

describe("paleta sin color", () => {
  it("devuelve el texto tal cual cuando NO_COLOR está activo", () => {
    for (const [name, paint] of Object.entries(palette)) {
      const output = paint(`texto ${name}`);

      expect(output).toBe(`texto ${name}`);
      expect(output).not.toContain(ANSI);
    }
  });
});

describe("paleta con color forzado", () => {
  it("envuelve el texto con secuencias ANSI cuando FORCE_COLOR está activo", () => {
    delete process.env.NO_COLOR;
    process.env.FORCE_COLOR = "1";

    expect(red("error")).toContain(ANSI);
    expect(red("error")).toContain("error");
    expect(cyan("menú")).toContain(ANSI);
    expect(yellow("20 °C")).toContain(ANSI);
    expect(green("ok")).toContain(ANSI);
    expect(dim("secundario")).toContain(ANSI);
    expect(cyanBold("título")).toContain(ANSI);
  });
});
