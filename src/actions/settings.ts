import { confirm } from "../presentation/input.ts";
import { showSuccess } from "../presentation/output.ts";
import { saveConfig, setUnitInConfig } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import type { Unit } from "../types/Unit.ts";
import { unitLabel } from "../utils/format.ts";

/** Opción 8: ajustes (unidad de temperatura). */
export async function settings(config: Config): Promise<Config> {
  const nextUnit: Unit = config.unit === "celsius" ? "fahrenheit" : "celsius";
  const confirmed = await confirm(`Cambiar la unidad de temperatura a ${unitLabel(nextUnit)}?`);
  if (!confirmed) return config;
  const next = setUnitInConfig(config, nextUnit);
  await saveConfig(next);
  showSuccess(`Unidad de temperatura: ${unitLabel(nextUnit)}`);
  return next;
}
