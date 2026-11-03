import { beforeEach, describe, expect, it } from "bun:test";
import {
  Cancelado,
  confirm,
  pickCity,
  pickSearchResult,
  promptCityName,
} from "../../src/presentation/input.ts";
import {
  CANCEL,
  confirmPrompts,
  queueConfirm,
  queueSelect,
  queueText,
  resetClack,
  selectPrompts,
  textPrompts,
} from "../helpers/clack.ts";
import { makeCity, makeCityInput } from "../helpers/fixtures.ts";

beforeEach(() => {
  resetClack();
});

describe("promptCityName", () => {
  it("pide el nombre y devuelve el texto normalizado", async () => {
    queueText("  Ottawa  ");

    await expect(promptCityName()).resolves.toBe("Ottawa");
    expect(textPrompts[0]?.message).toBe("Nombre de la ciudad");
    expect(textPrompts[0]?.placeholder).toBe("Ottawa");
  });

  it("valida que el nombre no esté vacío", async () => {
    queueText("Ottawa");

    await promptCityName();

    const validate = textPrompts[0]?.validate;
    expect(validate?.("")).toBe("Escribe el nombre de una ciudad.");
    expect(validate?.("   ")).toBe("Escribe el nombre de una ciudad.");
    expect(validate?.("Ottawa")).toBeUndefined();
  });

  it("lanza Cancelado cuando el usuario aborta el prompt", async () => {
    queueText(CANCEL);

    const promise = promptCityName();

    await expect(promise).rejects.toBeInstanceOf(Cancelado);
    await expect(promise).rejects.toThrow("Cancelado por el usuario");
  });
});

describe("pickCity", () => {
  const cities = [
    makeCity({ id: "ottawa", name: "Ottawa" }),
    makeCity({ id: "madrid", name: "Madrid", admin1: undefined, country: "España" }),
  ];

  it("muestra las ciudades etiquetadas y devuelve el id elegido", async () => {
    queueSelect("madrid");

    await expect(pickCity("Ciudad default", cities, "ottawa")).resolves.toBe("madrid");

    expect(selectPrompts[0]?.message).toBe("Ciudad default");
    expect(selectPrompts[0]?.initialValue).toBe("ottawa");
    expect(selectPrompts[0]?.options).toEqual([
      { value: "ottawa", label: "Ottawa, Ontario (Canadá)" },
      { value: "madrid", label: "Madrid (España)" },
    ]);
  });

  it("lanza Cancelado si se cancela la selección", async () => {
    queueSelect(CANCEL);

    await expect(pickCity("Ciudad default", cities)).rejects.toBeInstanceOf(Cancelado);
  });
});

describe("pickSearchResult", () => {
  const results = [
    makeCityInput({ name: "Ottawa", admin1: "Ontario", country: "Canadá" }),
    makeCityInput({ name: "Ottawa", admin1: "Ohio", country: "Estados Unidos", latitude: 41.02 }),
  ] as const;

  it("devuelve el único resultado sin abrir el selector", async () => {
    const only = makeCityInput();

    await expect(pickSearchResult([only])).resolves.toBe(only);
    expect(selectPrompts).toHaveLength(0);
  });

  it("lanza un error cuando la búsqueda viene vacía", async () => {
    await expect(pickSearchResult([])).rejects.toThrow("La búsqueda no devolvió resultados.");
  });

  it("deja elegir entre varios resultados por índice", async () => {
    queueSelect("1");

    await expect(pickSearchResult(results)).resolves.toBe(results[1]);
    expect(selectPrompts[0]?.message).toBe("2 resultados (elige uno)");
    expect(selectPrompts[0]?.options).toEqual([
      { value: "0", label: "Ottawa, Ontario (Canadá)" },
      { value: "1", label: "Ottawa, Ohio (Estados Unidos)" },
    ]);
  });

  it("cae al primer resultado si el índice elegido no existe", async () => {
    queueSelect("99");

    await expect(pickSearchResult(results)).resolves.toBe(results[0]);
  });

  it("lanza Cancelado si se cancela la selección", async () => {
    queueSelect(CANCEL);

    await expect(pickSearchResult(results)).rejects.toBeInstanceOf(Cancelado);
  });
});

describe("confirm", () => {
  it("devuelve la respuesta del usuario", async () => {
    queueConfirm(true, false);

    await expect(confirm("¿Continuar?")).resolves.toBe(true);
    await expect(confirm("¿Continuar?")).resolves.toBe(false);
    expect(confirmPrompts[0]?.message).toBe("¿Continuar?");
  });

  it("lanza Cancelado si se aborta la confirmación", async () => {
    queueConfirm(CANCEL);

    await expect(confirm("¿Continuar?")).rejects.toBeInstanceOf(Cancelado);
  });
});
