import * as clack from "@clack/prompts";

/** Tarea asíncrona monitoreable; puede actualizar el mensaje del spinner sobre la marcha. */
export type Task<T> = (update: (message: string) => void) => Promise<T>;

/**
 * Envuelve una tarea asíncrona con un spinner de clack.
 * Detiene el spinner sí o sí (éxito o error) y relanza el error tal cual,
 * para que el caller lo reporte al usuario una sola vez.
 */
export async function withSpinner<T>(message: string, task: Task<T>): Promise<T> {
  const spinner = clack.spinner();
  spinner.start(message);
  try {
    const result = await task((next) => spinner.message(next));
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}
