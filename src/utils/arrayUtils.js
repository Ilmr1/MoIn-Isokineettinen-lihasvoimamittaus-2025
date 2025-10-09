import { numberUtils } from "./utils";

const isArray = value => Array.isArray(value);

export const atWithWrapping = (array, index) => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }

  return array.at(index % array.length);
}
export const average = (array, precision) => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }
  const avg = array.reduce((acc, val) => acc + val, 0) / array.length;
  if (precision) {
    return numberUtils.truncDecimals(avg, precision);
  }

  return avg;
}
export const findByMinDelta = (array, value) => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }

  let min, index = 0;
  for (let i = 0; i < array.length; i++) {
    const delta = Math.abs(numberUtils.delta(value, array[i]));
    min ??= delta;
    if (min > delta) {
      min = delta;
      index = i;
    }
  }

  return array[index];
}

export const findByMaxDelta = (array, value) => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }

  let max, index = 0;
  for (let i = 0; i < array.length; i++) {
    const delta = numberUtils.absDelta(value, array[i]);
    max ??= delta;
    if (max < delta) {
      max = delta;
      index = i;
    }
  }

  return array[index];
}
export const coeffVar = array => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }
  const mean = array.reduce((a, b) => a + b, 0) / array.length;
  const variance = array.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / array.length;
  const sd = Math.sqrt(variance);
  return Math.abs((sd / mean) * 100);
}
export const stdDev = array => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }
  const mean = array.reduce((a, b) => a + b, 0) / array.length;
  return Math.sqrt(array.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / array.length);
}
export const maxValue = (array, defaultValue) => {
  if (!isArray(array) || array.length === 0) {
    return defaultValue;
  }
  return Math.max(...array);
}
export const minValue = array => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }
  return Math.min(...array);
}
export const sum = array => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }
  return array.reduce((a, b) => a + b, 0);
}
export const linearSlope = (x,y) => {
  if (!isArray(x) || x.length === 0 || !isArray(y) || y.length === 0) {
    return undefined
  }
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}
