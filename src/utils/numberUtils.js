export const roundDecimals = (number, decimals) => {
  const precision = Math.pow(10, decimals);
  return Math.round(number * precision) / precision;
}

export const padRoundDecimalsToLength = (number, charactersCount, maxDecimalsToKeep) => {
  const decimals = String(Math.trunc(Math.abs(number))).length;
  const decimalsToKeep = min(Math.max(0, charactersCount - decimals), maxDecimalsToKeep);
  return roundDecimals(number, decimalsToKeep).toFixed(decimalsToKeep);
}

export const truncDecimals = (number, decimals) => {
  const precision = Math.pow(10, decimals);
  return Math.trunc(number * precision) / precision;
}
export const padTrucateDecimalsToLength = (number, charactersCount, maxDecimalsToKeep) => {
  const decimals = String(Math.trunc(Math.abs(number))).length;
  const decimalsToKeep = min(Math.max(0, charactersCount - decimals), maxDecimalsToKeep);
  return truncDecimals(number, decimalsToKeep).toFixed(decimalsToKeep);
}

export const delta = (start, end) => Math.abs(end) - Math.abs(start);
export const absDelta = (start, end) => Math.abs(Math.max(end, start) - Math.min(end, start));
export const min = (a, b) => Math.min(a ?? b, b ?? a);
export const max = (a, b) => Math.max(a ?? b, b ?? a);
export const middle = (a, b) => Math.min(a, b) + (Math.max(a, b) - Math.min(a, b)) / 2;
export const equals = (a, b, precision) => absDelta(a, b) <= precision;

export const parseIfNumber = value => {
  if (value?.trim() === "") {
    return value;
  }

  const number = Number(value.replace(",", "."));
  if (isNaN(number)) {
    return value;
  }

  return number;
};

export const toRad = deg => deg * Math.PI / 180;


export const symmetryPercent = (value1, value2) => {
  let num1 = Math.abs(parseFloat(value1));
  let num2 = Math.abs(parseFloat(value2));
  let smaller = Math.min(num1, num2)
  let larger = Math.max(num1, num2)
  return padTrucateDecimalsToLength(((smaller/larger) * 100), 3);
};

export const trueToOneAndFalseToNegativeOne = boolean => !!boolean * 2 - 1;
export const ceilFurthestFromValue = (num, val = 0) => num > val ? Math.ceil(num) : Math.floor(num);
export const floorClosestToValue = (num, val = 0) => num > val ? Math.floor(num) : Math.ceil(num);
