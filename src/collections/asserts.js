export const assertTruthy = (condition, message = "Not true") => {
  if (!condition) {
    throw new Error(message);
  }
};

function errorMessate(strings, variableName, message) {
  if (variableName && message) {
    return `${strings[0]}${variableName}${strings[1]}${message}`;
  } else if (!message) {
    return `${strings[0]}${variableName}${strings[1]}`;
  } else if (!variableName) {
    return message;
  }
}

export const assertFalsy = (condition, message = "Not false") =>
  assertTruthy(!condition, message);

export const unreachable = (message = "Unreachable code path reached") =>
  assertTruthy(false, message);

export const assertTypeArray = (array, variableName = "Value", message) => {
  message = errorMessate`${variableName} is not type array. ${message}`;
  assertTruthy(Array.isArray(array), message);
};
export const assertTypeFunction = (fn, variableName = "Value", message) => {
  message = errorMessate`${variableName} is not type function. ${message}`;
  assertTruthy(typeof fn === "function", message);
};
export const assertTypeNumber = (number, variableName = "Value", message) => {
  message = errorMessate`${variableName} is not type number. ${message}`;
  assertTruthy(typeof number === "number" && !Number.isNaN(number), message);
};
export const assertTypeString = (string, variableName = "Value", message) => {
  message = errorMessate`${variableName} is not type string. ${message}`;
  assertTruthy(typeof string === "string", message);
};
export const assert2DArray = (array, variableName = "Value", message) => {
  message = errorMessate`${variableName} in not type of 2D array. ${message}`;
  assertTypeArray(array, null, message);
  assertTypeArray(array[0], null, message);
};

export const assert1DArrayOfNumbersOrEmptyArray = (
  array,
  variableName = "Value",
  message,
) => {
  message = errorMessate`${variableName} is not type of 1D number array. ${message}`;
  assertTypeArray(array, null, message);
  if (array.length) {
    assertTypeNumber(array[0], null, message);
  }
};

export const assert2DArrayOfNumbersOrEmptyArray = (
  array,
  variableName = "Value",
  message,
) => {
  message = errorMessate`${variableName} is not type of 2D number array. ${message}`;
  if (array?.length) {
    assert2DArray(array, null, message);
    assert1DArrayOfNumbersOrEmptyArray(array[0], null, message);
  } else {
    assertTypeArray(array, null, message);
  }
};

export const assertIsIntegerLike = (value, variableName = "Value", message) => {
  message = errorMessate`${variableName} is not integer. ${message}`;
  assertTruthy(typeof value === "string" || Number.isInteger(value), message);
  assertTruthy(value && Number.isInteger(+value), message);
};

export const arrayNotEmpty = (
  array,
  message = "Assertion failed because array is empty",
) => assertTruthy(array?.length, message);
