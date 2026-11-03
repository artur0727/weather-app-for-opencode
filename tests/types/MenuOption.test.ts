import { describe, expect, expectTypeOf, it } from "bun:test";
import type { Config } from "../../src/types/Config.ts";
import type { MenuAction, MenuOption } from "../../src/types/MenuOption.ts";
import { makeConfig } from "../helpers/fixtures.ts";

describe("MenuOption / MenuAction", () => {
  it("la opción es un par value/label para clack.select", () => {
    expectTypeOf<MenuOption>().toEqualTypeOf<{ value: string; label: string }>();

    const option: MenuOption = { value: "1", label: "Clima de ciudad default" };

    expect(option.value).toBe("1");
    expect(option.label).toContain("Clima");
  });

  it("la acción recibe un config y devuelve el config actualizado", async () => {
    expectTypeOf<MenuAction>().toEqualTypeOf<(config: Config) => Promise<Config>>();

    const action: MenuAction = async (config) => config;
    const config = makeConfig();

    await expect(action(config)).resolves.toBe(config);
  });
});
