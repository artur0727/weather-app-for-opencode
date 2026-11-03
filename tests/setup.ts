import { mock } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clack } from "./helpers/clack.ts";

// Bun no expone una TTY en los tests y además desactivamos el color explícitamente,
// para que `styleText` devuelva texto plano y las aserciones sean estables.
process.env.NO_COLOR = "1";

// Redirigimos el home a una carpeta temporal para que las acciones que llaman a
// `saveConfig()` sin path nunca escriban en la configuración real del usuario.
const fakeHome = mkdtempSync(join(tmpdir(), "weather-cli-home-"));
process.env.HOME = fakeHome;
process.env.USERPROFILE = fakeHome;
process.on("exit", () => {
  rmSync(fakeHome, { recursive: true, force: true });
});

// Los mocks de módulos son globales entre archivos de test: se registran acá,
// antes de que cualquier test importe los módulos que usan @clack/prompts.
mock.module("@clack/prompts", () => clack);
