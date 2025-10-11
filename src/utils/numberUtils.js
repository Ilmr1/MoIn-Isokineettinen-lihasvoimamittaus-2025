export const truncDecimals = (number, decimals) => {
  const precision = Math.pow(10, decimals);
  return Math.trunc(number * precision) / precision;
}

export const delta = (start, end) => Math.abs(end) - Math.abs(start);
export const absDelta = (start, end) => Math.abs(Math.max(end, start) - Math.min(end, start));
export const min = (a, b) => Math.min(a ?? b, b ?? a);
export const max = (a, b) => Math.max(a ?? b, b ?? a);
export const middle = (a, b) => Math.min(a, b) + (Math.max(a, b) - Math.min(a, b)) / 2;
export const equals = (a, b, precision) => Math.abs(a - b) <= precision;

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
