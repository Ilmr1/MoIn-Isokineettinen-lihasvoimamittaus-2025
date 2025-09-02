import { createRenderEffect, createSignal } from "solid-js";

export const createAssertError = callback => {
  const [error, setError] = createSignal();
  createRenderEffect(() => {
    try {
      callback();
      setError(false);
    } catch (e) {
      setError(true);
    }
  });

  return error;
}
