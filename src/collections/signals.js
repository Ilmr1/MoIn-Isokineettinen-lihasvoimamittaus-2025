import { createMemo, createSignal } from "solid-js";

export const assertError = (callback) => {
  return createMemo(() => {
    try {
      callback();
      return false;
    } catch (e) {
      console.error(e);
      return true;
    }
  });
};

const parseBoolean = (str) => {
  if (str === "true") {
    return true;
  }

  if (str === "false") {
    return false;
  }
};

const baseKey = "innovation-project-2025-";

export const localStorageBoolean = (key, initialValue) => {
  const [value, _setValue] = createSignal(
    parseBoolean(localStorage.getItem(baseKey + key)) ?? initialValue,
  );
  const setValue = (val) => {
    _setValue((v) => {
      const value = typeof val === "function" ? val(v) : val;
      if (value == null) {
        localStorage.removeItem(baseKey + key);
      } else {
        localStorage.setItem(baseKey + key, String(value));
      }

      return value;
    });
  };

  return [value, setValue];
};
