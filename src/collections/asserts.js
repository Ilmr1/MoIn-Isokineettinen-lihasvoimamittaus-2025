export const assertTrue = (condition, message = "Not true") => {
  if (!condition) {
    throw new Error(message);
  }
}

export const assertFalse = (condition, message = "Not false") => assertTrue(!condition, message);

export const unreachable = (message = "Unreachable code path reached") => assertTrue(false, message);

export const assertTypeArray = (array, message = "Value is not type array") => assertTrue(Array.isArray(array), message);
export const assertTypeNumber = (number, message = "Value is not type of number") => assertTrue(typeof number === "number" && !Number.isNaN(number), message);
export const assertTypeString = (string, message = "Value is not type of string") => assertTrue(typeof string === "string", message);
export const assert2DArray = (array, message = "Value is not 2D array") => {
  assertTypeArray(array, message);
  assertTypeArray(array[0], message);
}

export const arrayNotEmpty = (array, message = "Assertion failed because array is empty") => assertTrue(array?.length, message);
