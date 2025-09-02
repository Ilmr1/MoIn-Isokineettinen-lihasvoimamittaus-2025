export const assertTrue = (condition, message = "Not true") => {
  if (!condition) {
    throw new Error(message);
  }
}

export const assertFalse = (condition, message = "Not false") => assertTrue(!condition, message);

export const assertTypeArray = (array, message = "Value is array") => assertTrue(Array.isArray(array), message);
export const assert2DArray = (array, message = "Value is not 2D array") => {
  assertTypeArray(array, message);
  assertTypeArray(array[0], message);
}
