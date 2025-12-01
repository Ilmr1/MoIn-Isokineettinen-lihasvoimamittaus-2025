import { createRenderEffect, createSignal } from "solid-js";

export const createEffectSignal = (effeckHook) => {
  const [value, setValue] = createSignal();
  createRenderEffect(() => setValue(effeckHook));

  return [value, setValue];
};
