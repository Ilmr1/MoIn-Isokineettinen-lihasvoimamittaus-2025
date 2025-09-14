import { createMemo, createRenderEffect, createSignal } from "solid-js";

export const createAssertError = callback => {
  return createMemo(() => {
    try {
      callback();
      return false;
    } catch (e) {
      console.error(e);
      return true;
    }
  });
}
