import { mock } from "bun:test";

/**
 * Mock compartido de `@clack/prompts` para toda la suite.
 *
 * Bun comparte los mocks de módulos entre archivos de test, así que se registra
 * una sola vez desde `tests/setup.ts` (preload) para que `input`, `loading`,
 * `menu` y `output` siempre reciban esta misma implementación controlable.
 */

/** Valor que devuelven los prompts cuando el usuario cancela (equivalente al de clack). */
export const CANCEL = Symbol("clack:cancel");

export interface TextPromptOptions {
  message: string;
  placeholder?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectPromptOptions {
  message: string;
  initialValue?: string;
  options: SelectOption[];
}

export interface ConfirmPromptOptions {
  message: string;
}

type Response<T> = T | typeof CANCEL | Error;

const textResponses: Response<string>[] = [];
const selectResponses: Response<string>[] = [];
const confirmResponses: Response<boolean>[] = [];

/** Opciones recibidas por cada prompt, en orden de invocación. */
export const textPrompts: TextPromptOptions[] = [];
export const selectPrompts: SelectPromptOptions[] = [];
export const confirmPrompts: ConfirmPromptOptions[] = [];

export interface SpinnerMock {
  start: ReturnType<typeof mock<(message?: string) => void>>;
  message: ReturnType<typeof mock<(message?: string) => void>>;
  stop: ReturnType<typeof mock<(message?: string) => void>>;
}

/** Spinners creados por `clack.spinner()`, para inspeccionar start/message/stop. */
export const spinners: SpinnerMock[] = [];

function nextResponse<T>(queue: Response<T>[], fallback: T): T | typeof CANCEL {
  if (queue.length === 0) return fallback;
  const value = queue.shift();
  if (value instanceof Error) throw value;
  return value ?? fallback;
}

export function queueText(...values: Response<string>[]): void {
  textResponses.push(...values);
}

export function queueSelect(...values: Response<string>[]): void {
  selectResponses.push(...values);
}

export function queueConfirm(...values: Response<boolean>[]): void {
  confirmResponses.push(...values);
}

export function isCancel(value: unknown): value is typeof CANCEL {
  return value === CANCEL;
}

const text = mock(async (options: TextPromptOptions) => {
  textPrompts.push(options);
  return nextResponse(textResponses, "");
});

const select = mock(async (options: SelectPromptOptions) => {
  selectPrompts.push(options);
  return nextResponse(selectResponses, options.options[0]?.value ?? "");
});

const confirm = mock(async (options: ConfirmPromptOptions) => {
  confirmPrompts.push(options);
  return nextResponse(confirmResponses, false);
});

export function spinner(): SpinnerMock {
  const instance: SpinnerMock = {
    start: mock(() => {}),
    message: mock(() => {}),
    stop: mock(() => {}),
  };
  spinners.push(instance);
  return instance;
}

export const log = {
  success: mock((message: string) => message),
  warn: mock((message: string) => message),
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

export const outro = mock((message: string) => message);

/** Espacio de nombres que reemplaza a `@clack/prompts` en los tests. */
export const clack = {
  isCancel,
  text,
  select,
  confirm,
  spinner,
  log,
  outro,
};

/** Limpia colas, prompts capturados y llamadas entre tests. */
export function resetClack(): void {
  textResponses.length = 0;
  selectResponses.length = 0;
  confirmResponses.length = 0;
  textPrompts.length = 0;
  selectPrompts.length = 0;
  confirmPrompts.length = 0;
  spinners.length = 0;

  for (const spy of [text, select, confirm, log.success, log.warn, log.info, log.error, outro]) {
    spy.mockClear();
  }
}
