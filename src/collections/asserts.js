export const assertTruthy = (condition, message = "Not true") => {
  if (!condition) {
    throw new Error(message);
  }
}

export const assertFalsy = (condition, message = "Not false") => assertTruthy(!condition, message);

export const unreachable = (message = "Unreachable code path reached") => assertTruthy(false, message);

export const assertTypeArray = (array, variableName = "Value", message = variableName + " is not type array") => assertTruthy(Array.isArray(array), message);
export const assertTypeFunction = (fn, variableName = "Value", message = variableName + " is not type function") => assertTruthy(typeof fn === "function", message);
export const assertTypeNumber = (number, variableName = "Value", message = variableName + " is not type of number") => assertTruthy(typeof number === "number" && !Number.isNaN(number), message);
export const assertTypeString = (string, variableName = "Value", message = variableName + " is not type of string") => assertTruthy(typeof string === "string", message);
export const assert2DArray = (array, variableName = "Value", message = variableName + " in not type of 2D array") => {
  assertTypeArray(array, null, message);
  assertTypeArray(array[0], null, message);
}

export const assert1DArrayOfNumbersOrEmptyArray = (array, variableName = "Value", message = variableName + " is not type of 1D number array") => {
  assertTypeArray(array, null, message);
  if (array.length) {
    assertTypeNumber(array[0], null, message);
  }
}

export const assertIsIntegerLike = (value, varName = "Value", message = "") => {
  const localMessage = varName + " is not integer. " + message;
  assertTruthy(typeof value === "string" || Number.isInteger(value), localMessage);
  assertTruthy(value && Number.isInteger(+value), localMessage);
}

export const arrayNotEmpty = (array, message = "Assertion failed because array is empty") => assertTruthy(array?.length, message);
