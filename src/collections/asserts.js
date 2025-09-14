export const assertTruthy = (condition, message = "Not true") => {
  if (!condition) {
    throw new Error(message);
  }
}

export const assertFalse = (condition, message = "Not false") => assertTruthy(!condition, message);

export const unreachable = (message = "Unreachable code path reached") => assertTruthy(false, message);

export const assertTypeArray = (array, message = "Value is not type array") => assertTruthy(Array.isArray(array), message);
export const assertTypeNumber = (number, message = "Value is not type of number") => assertTruthy(typeof number === "number" && !Number.isNaN(number), message);
export const assertTypeString = (string, message = "Value is not type of string") => assertTruthy(typeof string === "string", message);
export const assert2DArray = (array, message = "Value is not 2D array") => {
  assertTypeArray(array, message);
  assertTypeArray(array[0], message);
}

export const arrayNotEmpty = (array, message = "Assertion failed because array is empty") => assertTruthy(array?.length, message);
